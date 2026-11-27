"""Small PixelLab v2 client: px.py <command> [json-body-file] [out]"""
import base64, json, sys, time, urllib.request, urllib.error

import os
KEY =open(os.environ.get("PIXELLAB_KEY_FILE", r"D:\Downloads\pixlabapi.txt")).read().strip()
BASE = "https://api.pixellab.ai/v2"


def call(method, path, body=None, raw=False):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers={
        "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            content = r.read()
            return content if raw else json.loads(content or b"{}")
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:2000])
        sys.exit(1)


def b64img(path):
    return {"type": "base64", "base64": base64.b64encode(open(path, "rb").read()).decode(), "format": "png"}


def poll(job_id):
    while True:
        j = call("GET", f"/background-jobs/{job_id}")
        st = j.get("status")
        if st != "processing":
            return j
        lr = j.get("last_response") or {}
        print("  ..", st, lr.get("queue_position"), lr.get("estimated_wait_seconds"), flush=True)
        time.sleep(8)


def summarize(obj):
    def strip(o):
        if isinstance(o, dict):
            return {k: ("<b64>" if k == "base64" else strip(v)) for k, v in o.items()}
        if isinstance(o, list):
            return [strip(v) for v in o]
        return o
    return json.dumps(strip(obj), indent=1)[:4000]


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "balance":
        print(call("GET", "/balance"))
    elif cmd == "post":  # px.py post /path body.json
        body = json.load(open(sys.argv[3], encoding="utf-8-sig"))
        for kv in sys.argv[4:]:  # overrides: key=<json>
            k, v = kv.split("=", 1)
            if k == "directions":
                body[k] = v.split(",")
            else:
                try:
                    body[k] = json.loads(v)
                except ValueError:
                    body[k] = v
        for k, v in list(body.items()):
            if isinstance(v, str) and v.startswith("@img:"):
                body[k] = b64img(v[5:])
        r = call("POST", sys.argv[2], body)
        print(summarize(r))
        ids = r.get("background_job_ids") or ([r["background_job_id"]] if r.get("background_job_id") else [])
        for jid in ids:
            print("job", jid)
            print(summarize(poll(jid)))
    elif cmd == "job":
        print(summarize(poll(sys.argv[2])))
    elif cmd == "char":
        print(summarize(call("GET", f"/characters/{sys.argv[2]}")))
    elif cmd == "zip":
        while True:
            req = urllib.request.Request(f"{BASE}/characters/{sys.argv[2]}/zip", headers={"Authorization": f"Bearer {KEY}"})
            try:
                with urllib.request.urlopen(req, timeout=300) as r:
                    open(sys.argv[3], "wb").write(r.read())
                    print("saved", sys.argv[3])
                    break
            except urllib.error.HTTPError as e:
                if e.code == 423:
                    print("  .. still generating"); time.sleep(10); continue
                print("HTTP", e.code, e.read().decode()[:500]); sys.exit(1)

