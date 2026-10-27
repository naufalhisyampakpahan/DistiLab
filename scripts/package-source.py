"""Package the app sources and public evidence without dependencies or signing keys."""

from pathlib import Path
import hashlib
import json
import os
import zipfile

root = Path(__file__).resolve().parents[1]
out = root / "artifacts" / "v1.1"
out.mkdir(parents=True, exist_ok=True)
target = out / "DistiLab-1.1.0-source.zip"
folders = ("app", "src", "assets", "tests", "scripts", "docs", "android")
root_files = (
    "README.md", "app.json", "eas.json", "package.json", "package-lock.json",
    "tsconfig.json", "jest.config.js", "babel.config.js", "expo-env.d.ts",
    ".gitignore", ".easignore", ".prettierignore", ".prettierrc",
)
skip_dirs = {"build", ".gradle", ".cxx", "__pycache__", "node_modules"}
files = [root / name for name in root_files if (root / name).is_file()]
for folder in folders:
    for current, dirs, names in os.walk(root / folder):
        dirs[:] = sorted(d for d in dirs if d not in skip_dirs)
        for name in sorted(names):
            file = Path(current) / name
            if (file.suffix.lower() in {".keystore", ".jks", ".log", ".pyc"}
                    or name in {"local.properties", "credentials.json"}
                    or name.startswith(".env") or name.endswith(".keystore.properties")):
                continue
            files.append(file)

manifest = {
    "appVersion": "1.1.0",
    "versionCode": 2,
    "files": [
        {"path": file.relative_to(root).as_posix(),
         "sha256": hashlib.sha256(file.read_bytes()).hexdigest()}
        for file in sorted(files)
    ],
    "privateSigningKeysIncluded": False,
    "nativeDebugKeystoreIncluded": False,
}
with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(files):
        archive.write(file, file.relative_to(root).as_posix())
    archive.writestr("source-manifest.json", json.dumps(manifest, indent=2))
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert not any(n.endswith((".jks", ".keystore")) for n in archive.namelist())
record = {"file": target.name, "files": len(files), "bytes": target.stat().st_size,
          "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}
(out / "source-package.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
print(json.dumps(record, indent=2))
