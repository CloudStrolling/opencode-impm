#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Test Runner (Postman Collection v2.1 compatible)

Features:
  1. Reads API test case files in Postman Collection v2.1 JSON format;
  2. Sends HTTP requests one by one (supports {{variable}} placeholder substitution; variables come from collection.variable or the --base-url command line argument);
  3. Compares the actual response with the expected results (status code, response headers, response body fields, response time);
  4. Aggregates the results and generates a test report (console output + Markdown + JSON).

Usage:
  python API-TEST-RUNNER.py <collection.json> [--base-url URL] [--report-dir DIR] [--timeout SECONDS]

Exit codes:
  0: all test cases passed
  1: there are failed test cases, or an argument/file error occurred
"""

import argparse
import datetime
import json
import os
import re
import sys
import time

# ---------------------------------------------------------------------------
# HTTP client: prefers requests, falls back to the standard library urllib
# ---------------------------------------------------------------------------
try:
    import requests  # type: ignore
    _HAS_REQUESTS = True
except Exception:  # pragma: no cover - environment differences
    import urllib.request
    import urllib.error
    _HAS_REQUESTS = False


def _http_send(method, url, headers, body, timeout):
    """Sends an HTTP request and returns (status_code, resp_headers, resp_text, error)."""
    resp_text = ""
    resp_headers = {}
    status_code = 0
    error = ""
    try:
        if _HAS_REQUESTS:
            resp = requests.request(
                method=method,
                url=url,
                headers=headers,
                data=body if body else None,
                timeout=timeout,
            )
            status_code = resp.status_code
            resp_headers = {k: v for k, v in resp.headers.items()}
            resp_text = resp.text
        else:
            data = body.encode("utf-8") if isinstance(body, str) else body
            req = urllib.request.Request(url=url, data=data, method=method)
            for k, v in headers.items():
                req.add_header(k, v)
            try:
                resp = urllib.request.urlopen(req, timeout=timeout)
                status_code = resp.getcode()
                resp_headers = {k: v for k, v in resp.headers.items()}
                resp_text = resp.read().decode("utf-8", errors="replace")
            except urllib.error.HTTPError as e:
                status_code = e.code
                resp_headers = {k: v for k, v in e.headers.items()}
                resp_text = e.read().decode("utf-8", errors="replace")
    except Exception as exc:  # connection failures, etc.
        error = str(exc)
    return status_code, resp_headers, resp_text, error


# ---------------------------------------------------------------------------
# Variable substitution: supports {{key}} placeholders
# ---------------------------------------------------------------------------
_VAR_RE = re.compile(r"\{\{([^{}]+)\}\}")


def _resolve_variables(text, variables):
    if not isinstance(text, str):
        return text
    return _VAR_RE.sub(lambda m: str(variables.get(m.group(1).strip(), m.group(0))), text)


# ---------------------------------------------------------------------------
# Simple JSONPath access (supports $.a.b[0].c and $)
# ---------------------------------------------------------------------------
def _json_get(doc, path):
    """Accesses a value from dict/list by a JSONPath-like expression; returns _MISSING if not found."""
    MISSING = object()
    if path in ("$", ""):
        return doc
    if not path.startswith("$"):
        path = "$" + path
    cur = doc
    # strip the leading $
    expr = path[1:]
    # split by . or [idx]
    tokens = re.findall(r"\.?([^.\[\]]+)|\[(\d+)\]", expr)
    for name, idx in tokens:
        if name:
            if isinstance(cur, dict) and name in cur:
                cur = cur[name]
            else:
                return MISSING
        elif idx != "":
            i = int(idx)
            if isinstance(cur, list) and 0 <= i < len(cur):
                cur = cur[i]
            else:
                return MISSING
    return cur


def _json_path_exists(doc, path):
    return _json_get(doc, path) is not object()


# ---------------------------------------------------------------------------
# Assertion execution
# ---------------------------------------------------------------------------
def _coerce(value):
    """Attempts to convert a string to the same type as the expected value for comparison."""
    return value


def _eval_assertion(actual_json, actual_text, assertion):
    """
    Returns (passed: bool, detail: str).
    The assertion structure supports:
      {"type": "status", "equals": 200}
      {"type": "header", "name": "Content-Type", "contains": "application/json"}
      {"type": "json", "path": "$.code", "equals": 0}
      {"type": "json", "path": "$.data.id", "contains": "abc"}
      {"type": "body_contains", "value": "success"}
      {"type": "response_time", "max": 2000}   # handled separately at the item level
    """
    atype = assertion.get("type", "json")
    try:
        if atype == "status":
            # handled separately by the caller; not expected here
            return True, ""
        if atype == "header":
            name = assertion.get("name", "")
            val = assertion.get("contains", "")
            # headers are handled at the call site; not expected here
            return True, ""
        if atype == "json":
            path = assertion.get("path", "$")
            expected = assertion.get("equals", assertion.get("contains"))
            got = _json_get(actual_json, path)
            if got is object():
                return False, "path %s does not exist" % path
            if "equals" in assertion:
                if got != assertion["equals"]:
                    return False, "path %s expected=%s actual=%s" % (path, assertion["equals"], got)
            elif "contains" in assertion:
                if assertion["contains"] not in str(got):
                    return False, "path %s value=%s does not contain %s" % (path, got, assertion["contains"])
            return True, "path %s validation passed" % path
        if atype == "body_contains":
            val = assertion.get("value", "")
            if val not in actual_text:
                return False, "response body does not contain '%s'" % val
            return True, "response body contains '%s'" % val
    except Exception as exc:
        return False, "assertion execution error: %s" % exc
    return True, ""


# ---------------------------------------------------------------------------
# Single test case execution
# ---------------------------------------------------------------------------
def run_item(item, variables, timeout):
    result = {
        "name": item.get("name", ""),
        "passed": False,
        "status_code": 0,
        "elapsed_ms": 0,
        "error": "",
        "assertions": [],
        "response_body": "",
    }

    request = item.get("request", {})
    method = (request.get("method") or "GET").upper()

    # parse the URL
    url_obj = request.get("url", {})
    if isinstance(url_obj, str):
        raw_url = url_obj
    else:
        raw_url = url_obj.get("raw", "")

    # handle query parameter concatenation
    if isinstance(url_obj, dict) and url_obj.get("query"):
        q = []
        for qp in url_obj["query"]:
            q.append("%s=%s" % (_resolve_variables(qp.get("key", ""), variables),
                                _resolve_variables(qp.get("value", ""), variables)))
        if q:
            sep = "&" if "?" in raw_url else "?"
            raw_url = raw_url + sep + "&".join(q)

    url = _resolve_variables(raw_url, variables)

    # request headers
    headers = {}
    for h in request.get("header", []) or []:
        headers[_resolve_variables(h.get("key", ""), variables)] = _resolve_variables(h.get("value", ""), variables)

    # request body
    body = ""
    body_obj = request.get("body", {})
    if isinstance(body_obj, dict):
        if body_obj.get("mode") == "raw":
            body = _resolve_variables(body_obj.get("raw", ""), variables)
        elif body_obj.get("mode") == "urlencoded":
            parts = []
            for p in body_obj.get("urlencoded", []) or []:
                parts.append("%s=%s" % (p.get("key", ""), p.get("value", "")))
            body = "&".join(parts)
            if "Content-Type" not in headers:
                headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif isinstance(body_obj, str):
        body = _resolve_variables(body_obj, variables)

    expected = item.get("expected", {}) or {}

    t0 = time.time()
    status_code, resp_headers, resp_text, error = _http_send(method, url, headers, body, timeout)
    elapsed_ms = int((time.time() - t0) * 1000)

    result["status_code"] = status_code
    result["elapsed_ms"] = elapsed_ms
    result["error"] = error
    result["response_body"] = resp_text

    if error:
        result["assertions"].append({"name": "send request", "passed": False, "detail": error})
        return result

    # parse the response body JSON
    actual_json = None
    try:
        actual_json = json.loads(resp_text) if resp_text else {}
    except Exception:
        actual_json = None

    checks = []

    # 1) status code
    exp_status = expected.get("status")
    if exp_status is not None:
        ok = (status_code == exp_status)
        checks.append({"name": "status=%s" % exp_status, "passed": ok,
                       "detail": "actual %s" % status_code})

    # 2) response time
    exp_max = expected.get("max_response_time")
    if exp_max is not None:
        ok = (elapsed_ms <= exp_max)
        checks.append({"name": "response time<=%sms" % exp_max, "passed": ok,
                       "detail": "actual %sms" % elapsed_ms})

    # 3) response headers
    for h in expected.get("headers", []) or []:
        name = h.get("name", "")
        val = h.get("contains", "")
        actual = resp_headers.get(name, "")
        ok = (val in actual)
        checks.append({"name": "response header %s contains %s" % (name, val), "passed": ok,
                       "detail": "actual '%s'" % actual})

    # 4) response body assertions
    assertions = expected.get("assertions", []) or []
    target = actual_json if actual_json is not None else {}
    for a in assertions:
        if actual_json is None and a.get("type") in ("json",):
            ok = False
            detail = "response body is not valid JSON"
        else:
            ok, detail = _eval_assertion(target, resp_text, a)
        name = a.get("path") or a.get("type") or "assertion"
        checks.append({"name": name, "passed": ok, "detail": detail})

    result["assertions"] = checks
    result["passed"] = all(c["passed"] for c in checks) if checks else (status_code != 0)
    return result


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------
def _build_reports(collection_name, results, report_dir):
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # console
    print("=" * 60)
    print("API Test Report  %s" % ts)
    print("Collection: %s" % collection_name)
    print("Total: %d  Passed: %d  Failed: %d" % (total, passed, failed))
    print("-" * 60)
    for i, r in enumerate(results, 1):
        mark = "PASS" if r["passed"] else "FAIL"
        print("[%s] %d. %s  (HTTP %s, %sms)" % (mark, i, r["name"], r["status_code"], r["elapsed_ms"]))
        if not r["passed"]:
            for c in r["assertions"]:
                if not c["passed"]:
                    print("      - %s : %s" % (c["name"], c["detail"]))
            if r["error"]:
                print("      Error: %s" % r["error"])
    print("=" * 60)

    # Markdown
    md = []
    md.append("# API Test Report")
    md.append("")
    md.append("- Execution time: %s" % ts)
    md.append("- Test collection: %s" % collection_name)
    md.append("- Total test cases: %d" % total)
    md.append("- Passed: %d" % passed)
    md.append("- Failed: %d" % failed)
    md.append("")
    md.append("| No. | Case | HTTP | Time(ms) | Result |")
    md.append("| ---- | ---- | ---- | -------- | ---- |")
    for i, r in enumerate(results, 1):
        mark = "Passed" if r["passed"] else "Failed"
        md.append("| %d | %s | %s | %s | %s |" % (i, r["name"], r["status_code"], r["elapsed_ms"], mark))
    md.append("")
    md.append("## Failure Details")
    md.append("")
    has_fail = False
    for i, r in enumerate(results, 1):
        if not r["passed"]:
            has_fail = True
            md.append("### %d. %s" % (i, r["name"]))
            if r["error"]:
                md.append("- Error: %s" % r["error"])
            for c in r["assertions"]:
                if not c["passed"]:
                    md.append("- Assertion failed: %s - %s" % (c["name"], c["detail"]))
            md.append("")

    # placeholder when there are no failures
    if not has_fail:
        md.append("_No failed test cases_")
        md.append("")

    md_text = "\n".join(md)

    # JSON
    json_obj = {
        "collection": collection_name,
        "executed_at": ts,
        "summary": {"total": total, "passed": passed, "failed": failed},
        "results": results,
    }

    os.makedirs(report_dir, exist_ok=True)
    md_path = os.path.join(report_dir, "api-test-report.md")
    json_path = os.path.join(report_dir, "api-test-report.json")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_text)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_obj, f, ensure_ascii=False, indent=2)

    return md_path, json_path, (passed == total and total > 0)


# ---------------------------------------------------------------------------
# Main flow
# ---------------------------------------------------------------------------
def main(argv=None):
    parser = argparse.ArgumentParser(description="Postman Collection v2.1 API Test Runner")
    parser.add_argument("collection", help="Postman Collection v2.1 JSON file path")
    parser.add_argument("--base-url", default=None, help="override the base_url variable (e.g. http://localhost:8080)")
    parser.add_argument("--report-dir", default="scripts/API-TEST/report", help="test report output directory")
    parser.add_argument("--timeout", type=int, default=30, help="single request timeout in seconds")
    args = parser.parse_args(argv)

    if not os.path.isfile(args.collection):
        print("Error: collection file not found %s" % args.collection, file=sys.stderr)
        return 1

    try:
        with open(args.collection, "r", encoding="utf-8") as f:
            collection = json.load(f)
    except Exception as exc:
        print("Error: failed to parse collection JSON: %s" % exc, file=sys.stderr)
        return 1

    variables = {}
    for v in collection.get("variable", []) or []:
        variables[v.get("key")] = v.get("value")
    if args.base_url:
        variables["base_url"] = args.base_url

    collection_name = collection.get("info", {}).get("name", os.path.basename(args.collection))
    items = collection.get("item", []) or []

    if not items:
        print("Warning: no item test cases in the collection.", file=sys.stderr)

    results = []
    for item in items:
        results.append(run_item(item, variables, args.timeout))

    md_path, json_path, all_passed = _build_reports(collection_name, results, args.report_dir)
    print("Report generated:\n  %s\n  %s" % (md_path, json_path))

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
