

Run actions/checkout@v4
Syncing repository: elliotttmiller/drywall-toolbox
Getting Git version info
Temporarily overriding HOME='/home/runner/work/_temp/e29ad68e-2240-41a7-9c75-9924c82b7092' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/drywall-toolbox/drywall-toolbox
Deleting the contents of '/home/runner/work/drywall-toolbox/drywall-toolbox'
Initializing the repository
Disabling automatic garbage collection
Setting up auth
Fetching the repository
Determining the checkout info
/usr/bin/git sparse-checkout disable
/usr/bin/git config --local --unset-all extensions.worktreeConfig
Checking out the ref
/usr/bin/git log -1 --format=%H
45bc9097be0496ea716e4cfcc000cf592075ed39
1s
Run actions/setup-node@v4
Found in cache @ /opt/hostedtoolcache/node/20.20.1/x64
Environment details
/opt/hostedtoolcache/node/20.20.1/x64/bin/npm config get cache
/home/runner/.npm
Cache hit for: node-cache-Linux-x64-npm-ecf74911a53575a34e0b9e1d7f69bbc5a66fe48affe8ed876ab2cb6c55eaa41c
Received 38319842 of 38319842 (100.0%), 73.1 MBs/sec
Cache Size: ~37 MB (38319842 B)
/usr/bin/tar -xf /home/runner/work/_temp/d4af9570-37d6-43d2-be4c-601bc67591bc/cache.tzst -P -C /home/runner/work/drywall-toolbox/drywall-toolbox --use-compress-program unzstd
Cache restored successfully
Cache restored from key: node-cache-Linux-x64-npm-ecf74911a53575a34e0b9e1d7f69bbc5a66fe48affe8ed876ab2cb6c55eaa41c
6s
Run cd frontend && npm ci --prefer-offline --no-audit --no-fund

added 835 packages in 5s
12s
Run cd frontend && npm run build

> drywall-toolbox-frontend@0.0.0 build
> webpack --config webpack.config.cjs --mode production

assets by path assets/ 1.04 MiB
  assets by path assets/js/*.js 886 KiB 19 assets
  assets by path assets/images/*.svg 62.2 KiB 6 assets
  assets by path assets/css/*.css 113 KiB 3 assets
assets by path *.svg 9.62 KiB
  asset logo.svg 3.29 KiB [emitted] [from: public/logo.svg] [copied]
  asset logo-white.svg 2.77 KiB [emitted] [from: public/logo-white.svg] [copied]
  asset logo2.svg 2.77 KiB [emitted] [from: public/logo2.svg] [copied]
  asset vite.svg 806 bytes [emitted] [from: public/vite.svg] [copied]
assets by path *.html 3.44 KiB
  asset index.html 1.75 KiB [emitted]
  asset 404.html 1.68 KiB [emitted] [from: public/404.html] [copied]
asset pwa_icon.png 26.2 KiB [emitted] [from: public/pwa_icon.png] [copied]
asset asset-manifest.json 3.6 KiB [emitted]
Entrypoint main [big] 577 KiB (2.63 MiB) = assets/js/runtime.a5cfdcc3.js 4.33 KiB assets/js/vendor-react.8e244178.js 222 KiB assets/js/vendor.75699d50.js 230 KiB assets/css/main.fdad73c7.css 80.6 KiB assets/js/main.13b177fa.js 40.4 KiB 5 auxiliary assets
chunk (runtime: runtime) assets/css/common.f395f3da.chunk.css, assets/js/common.31f57529.chunk.js (common) (id hint: common) 76.1 KiB (javascript) 59.4 KiB (asset) 9.62 KiB (css/mini-extract) [rendered] split chunk (cache group: common) (name: common)
  dependent modules 59.4 KiB (asset) 16.5 KiB (javascript) 9.62 KiB (css/mini-extract) [dependent] 8 modules
  cacheable modules 59.6 KiB
    ./src/components/BackButton.jsx 476 bytes [built] [code generated]
    ./src/components/FilterPanel.jsx 15 KiB [built] [code generated]
    ./src/components/ProductDetail.jsx + 2 modules 29.4 KiB [built] [code generated]
    ./src/components/SearchBar.jsx 1.76 KiB [built] [code generated]
    ./src/components/SortDropdown.jsx 3.88 KiB [built] [code generated]
    ./src/components/Toast.jsx 1.67 KiB [built] [code generated]
    ./src/services/api.js 7.41 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/107.cfe47830.chunk.js 18.7 KiB [rendered]
  ./src/pages/Products.jsx 18.7 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/118.4ac144dd.chunk.js 3.85 KiB [rendered]
  ./src/pages/Product.jsx 3.85 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/runtime.a5cfdcc3.js (runtime) 10.9 KiB [entry] [rendered]
  runtime modules 10.9 KiB 12 modules
chunk (runtime: runtime) assets/js/177.46014d3e.chunk.js 54.5 KiB [rendered]
  ./src/pages/Repairs.jsx 54.5 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/187.ee3f8c24.chunk.js 31.8 KiB [rendered]
  ./src/pages/Checkout.jsx 31.8 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/429.f10f3f16.chunk.js 11 KiB [rendered]
  ./src/pages/Cart.jsx 11 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/462.b12fd91f.chunk.js 14.7 KiB [rendered]
  ./src/pages/AllProducts.jsx 14.7 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/472.d5f785a4.chunk.js 24.6 KiB [rendered]
  ./src/pages/About.jsx 24.6 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/492.5c4d8388.chunk.js 14.7 KiB [rendered]
  ./src/pages/VeeqoSettings.jsx 14.7 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/vendor.75699d50.js (vendor) (id hint: vendor) 881 KiB [initial] [rendered] split chunk (cache group: vendor) (name: vendor)
  dependent modules 76.5 KiB [dependent] 20 modules
  modules by path ./node_modules/lucide-react/dist/esm/ 20.2 KiB
    ./node_modules/lucide-react/dist/esm/icons/arrow-left.js 498 bytes [built] [code generated]
    ./node_modules/lucide-react/dist/esm/icons/arrow-right.js 501 bytes [built] [code generated]
    + 32 modules
  ./node_modules/dompurify/dist/purify.es.mjs 63.1 KiB [built] [code generated]
  ./node_modules/react-markdown/lib/index.js + 114 modules 438 KiB [built] [code generated]
  ./node_modules/remark-gfm/lib/index.js + 56 modules 156 KiB [built] [code generated]
  ./node_modules/scheduler/index.js 194 bytes [built] [code generated]
  ./node_modules/socket.io-client/build/esm/index.js + 28 modules 127 KiB [built] [code generated]
chunk (runtime: runtime) assets/css/551.bd8476c0.chunk.css, assets/js/551.c56cd2f4.chunk.js 274 KiB (javascript) 38 KiB (css/mini-extract) [rendered]
  dependent modules 38 KiB [dependent] 2 modules
  ./src/pages/Parts.jsx + 41 modules 274 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/657.07735132.chunk.js 23.9 KiB [rendered]
  ./src/pages/Home.jsx + 1 modules 23.9 KiB [built] [code generated]
chunk (runtime: runtime) assets/css/main.fdad73c7.css, assets/js/main.13b177fa.js (main) 81.9 KiB (javascript) 2.77 KiB (asset) 98 KiB (css/mini-extract) [initial] [rendered]
  dependent modules 36.8 KiB (javascript) 98 KiB (css/mini-extract) [dependent] 6 modules
  cacheable modules 2.77 KiB (asset) 45.2 KiB (javascript)
    ./public/logo2.svg 2.77 KiB (asset) 42 bytes (javascript) [built] [code generated]
    ./src/main.jsx + 6 modules 45.1 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/812.ceb17d24.chunk.js 17.3 KiB [rendered]
  ./src/pages/WooCommerceSettings.jsx 17.3 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/822.291e2acb.chunk.js 5.41 KiB [rendered]
  ./src/pages/CategoryPage.jsx 5.41 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/826.68988968.chunk.js 3.47 KiB [rendered]
  ./src/pages/VeeqoCallback.jsx 3.47 KiB [built] [code generated]
chunk (runtime: runtime) assets/js/vendor-react.8e244178.js (vendor-react) (id hint: reactVendor) 903 KiB [initial] [rendered] split chunk (cache group: reactVendor) (name: vendor-react)
  dependent modules 549 KiB [dependent] 6 modules
  cacheable modules 353 KiB
    ./node_modules/react-dom/client.js 1.34 KiB [built] [code generated]
    ./node_modules/react-router/dist/development/chunk-UVKPFVEO.mjs 352 KiB [built] [code generated]
    ./node_modules/react/jsx-runtime.js 210 bytes [built] [code generated]
chunk (runtime: runtime) assets/js/983.4fdf2754.chunk.js 11.7 KiB [rendered]
  ./src/pages/Contact.jsx 11.7 KiB [built] [code generated]

WARNING in entrypoint size limit: The following entrypoint(s) combined asset size exceeds the recommended limit (488 KiB). This can impact web performance.
Entrypoints:
  main (577 KiB)
      assets/js/runtime.a5cfdcc3.js
      assets/js/vendor-react.8e244178.js
      assets/js/vendor.75699d50.js
      assets/css/main.fdad73c7.css
      assets/js/main.13b177fa.js


webpack 5.105.4 compiled with 1 warning in 11684 ms
0s
Run DIST="dist"
── dist contents ──
dist/404.html
dist/asset-manifest.json
dist/assets/css/551.bd8476c0.chunk.css
dist/assets/css/common.f395f3da.chunk.css
dist/assets/css/main.fdad73c7.css
dist/assets/images/asgard_logo.38790261.svg
dist/assets/images/columbia_taping_tools_logo.2cce4b5a.svg
dist/assets/images/graco_logo.f79c3fbc.svg
dist/assets/images/logo2.5b5286f8.svg
dist/assets/images/surpro_logo.6fe699bd.svg
dist/assets/images/tapetech_logo.24449b0c.svg
dist/assets/js/107.cfe47830.chunk.js
dist/assets/js/107.cfe47830.chunk.js.map
dist/assets/js/118.4ac144dd.chunk.js
dist/assets/js/118.4ac144dd.chunk.js.map
dist/assets/js/177.46014d3e.chunk.js
dist/assets/js/177.46014d3e.chunk.js.map
dist/assets/js/187.ee3f8c24.chunk.js
dist/assets/js/187.ee3f8c24.chunk.js.map
dist/assets/js/429.f10f3f16.chunk.js
dist/assets/js/429.f10f3f16.chunk.js.map
dist/assets/js/462.b12fd91f.chunk.js
dist/assets/js/462.b12fd91f.chunk.js.map
dist/assets/js/472.d5f785a4.chunk.js
dist/assets/js/472.d5f785a4.chunk.js.map
dist/assets/js/492.5c4d8388.chunk.js
dist/assets/js/492.5c4d8388.chunk.js.map
dist/assets/js/551.c56cd2f4.chunk.js
dist/assets/js/551.c56cd2f4.chunk.js.map
dist/assets/js/657.07735132.chunk.js
dist/assets/js/657.07735132.chunk.js.map
dist/assets/js/812.ceb17d24.chunk.js
dist/assets/js/812.ceb17d24.chunk.js.map
dist/assets/js/822.291e2acb.chunk.js
dist/assets/js/822.291e2acb.chunk.js.map
dist/assets/js/826.68988968.chunk.js
dist/assets/js/826.68988968.chunk.js.map
dist/assets/js/983.4fdf2754.chunk.js
dist/assets/js/983.4fdf2754.chunk.js.map
dist/assets/js/common.31f57529.chunk.js
dist/assets/js/common.31f57529.chunk.js.map
dist/assets/js/main.13b177fa.js
dist/assets/js/main.13b177fa.js.map
dist/assets/js/runtime.a5cfdcc3.js
dist/assets/js/runtime.a5cfdcc3.js.map
dist/assets/js/vendor-react.8e244178.js
dist/assets/js/vendor-react.8e244178.js.map
dist/assets/js/vendor.75699d50.js
dist/assets/js/vendor.75699d50.js.map
dist/index.html
dist/logo-white.svg
dist/logo.svg
dist/logo2.svg
dist/pwa_icon.png
dist/vite.svg
✓ Build output validated.
0s
Run echo "Pruning .map files from dist/..."
Pruning .map files from dist/...
dist/assets/js/492.5c4d8388.chunk.js.map
dist/assets/js/826.68988968.chunk.js.map
dist/assets/js/main.13b177fa.js.map
dist/assets/js/822.291e2acb.chunk.js.map
dist/assets/js/177.46014d3e.chunk.js.map
dist/assets/js/vendor-react.8e244178.js.map
dist/assets/js/107.cfe47830.chunk.js.map
dist/assets/js/472.d5f785a4.chunk.js.map
dist/assets/js/462.b12fd91f.chunk.js.map
dist/assets/js/429.f10f3f16.chunk.js.map
dist/assets/js/vendor.75699d50.js.map
dist/assets/js/551.c56cd2f4.chunk.js.map
dist/assets/js/812.ceb17d24.chunk.js.map
dist/assets/js/983.4fdf2754.chunk.js.map
dist/assets/js/118.4ac144dd.chunk.js.map
dist/assets/js/common.31f57529.chunk.js.map
dist/assets/js/657.07735132.chunk.js.map
dist/assets/js/187.ee3f8c24.chunk.js.map
dist/assets/js/runtime.a5cfdcc3.js.map
✓ Pruning complete.
0s
Run echo "key=build-45bc9097be0496ea716e4cfcc000cf592075ed39" >> "$GITHUB_OUTPUT"
1s
Run actions/upload-artifact@v4
With the provided path, there will be 36 files uploaded
Artifact name is valid!
Root directory input is valid!
Beginning upload of artifact content to blob storage
Uploaded bytes 314883
Finished uploading artifact content to blob storage!
SHA256 digest of uploaded artifact zip is e32a62ade9177f3c22aa1d4bdbcb0d7e4a970e3035304313873e2df60be1c7c5
Finalizing artifact upload
Artifact build-45bc9097be0496ea716e4cfcc000cf592075ed39.zip successfully finalized. Artifact ID 6176318385
Artifact build-45bc9097be0496ea716e4cfcc000cf592075ed39 has been successfully uploaded! Final size is 314883 bytes. Artifact ID is 6176318385
Artifact download URL: https://github.com/elliotttmiller/drywall-toolbox/actions/runs/23740990838/artifacts/6176318385
1s
Post job cleanup.
Cache hit occurred on the primary key node-cache-Linux-x64-npm-ecf74911a53575a34e0b9e1d7f69bbc5a66fe48affe8ed876ab2cb6c55eaa41c, not saving cache.
0s
Post job cleanup.
/usr/bin/git version
git version 2.53.0
Temporarily overriding HOME='/home/runner/work/_temp/a19d37e0-3cca-4a66-905c-79b36f69592c' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/drywall-toolbox/drywall-toolbox
/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
http.https://github.com/.extraheader
/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url




Run actions/checkout@v4
Syncing repository: elliotttmiller/drywall-toolbox
Getting Git version info
Temporarily overriding HOME='/home/runner/work/_temp/3855d138-a4d4-45d3-aaaa-61692d1a7e7b' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/drywall-toolbox/drywall-toolbox
Deleting the contents of '/home/runner/work/drywall-toolbox/drywall-toolbox'
Initializing the repository
Disabling automatic garbage collection
Setting up auth
Fetching the repository
Determining the checkout info
Setting up sparse checkout
Checking out the ref
/usr/bin/git log -1 --format=%H
45bc9097be0496ea716e4cfcc000cf592075ed39
0s
Run actions/download-artifact@v4
Downloading single artifact
Preparing to download the following artifacts:
- build-45bc9097be0496ea716e4cfcc000cf592075ed39 (ID: 6176318385, Size: 314883, Expected Digest: sha256:e32a62ade9177f3c22aa1d4bdbcb0d7e4a970e3035304313873e2df60be1c7c5)
Redirecting to blob download url: https://productionresultssa3.blob.core.windows.net/actions-results/7d118223-f762-453b-82f4-135d24d9634f/workflow-job-run-d7add22e-b23e-5f44-b098-27f7712b880c/artifacts/9143a5b101d48aa1f3adf95f2a3d5b587052fd9ee1c57e6804ec0fb96159cb5f.zip
Starting download of artifact to: /home/runner/work/drywall-toolbox/drywall-toolbox/dist
(node:2300) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
SHA256 digest of downloaded artifact is e32a62ade9177f3c22aa1d4bdbcb0d7e4a970e3035304313873e2df60be1c7c5
Artifact download completed successfully.
Total of 1 artifact(s) downloaded
Download artifact has finished successfully
0s
Run echo "── dist ──"
── dist ──
total 68
drwxr-xr-x 3 runner runner  4096 Mar 30 10:50 .
drwxr-xr-x 5 runner runner  4096 Mar 30 10:50 ..
-rw-r--r-- 1 runner runner  1724 Mar 30 10:50 404.html
-rw-r--r-- 1 runner runner  3690 Mar 30 10:50 asset-manifest.json
drwxr-xr-x 5 runner runner  4096 Mar 30 10:50 assets
-rw-r--r-- 1 runner runner  1794 Mar 30 10:50 index.html
-rw-r--r-- 1 runner runner  2840 Mar 30 10:50 logo-white.svg
-rw-r--r-- 1 runner runner  3365 Mar 30 10:50 logo.svg
-rw-r--r-- 1 runner runner  2840 Mar 30 10:50 logo2.svg
-rw-r--r-- 1 runner runner 26867 Mar 30 10:50 pwa_icon.png
-rw-r--r-- 1 runner runner   806 Mar 30 10:50 vite.svg
── wp/wp-content ──
total 16
drwxr-xr-x 4 runner runner 4096 Mar 30 10:50 .
drwxr-xr-x 3 runner runner 4096 Mar 30 10:50 ..
drwxr-xr-x 2 runner runner 4096 Mar 30 10:50 mu-plugins
drwxr-xr-x 4 runner runner 4096 Mar 30 10:50 themes
── root files ──
-rw-r--r-- 1 runner runner 5620 Mar 30 10:50 .htaccess
-rw-r--r-- 1 runner runner   70 Mar 30 10:50 index.php
0s
0s
Run mkdir -p root-deploy
── root-deploy contents ──
total 20
drwxr-xr-x 2 runner runner 4096 Mar 30 10:50 .
drwxr-xr-x 6 runner runner 4096 Mar 30 10:50 ..
-rw-r--r-- 1 runner runner 5620 Mar 30 10:50 .htaccess
-rw-r--r-- 1 runner runner   70 Mar 30 10:50 index.php
7s
Run SamKirkland/FTP-Deploy-Action@v4.3.5
----------------------------------------------------------------
🚀 Thanks for using ftp-deploy. Let's deploy some stuff!   
----------------------------------------------------------------
If you found this project helpful, please support it
by giving it a ⭐ on Github --> https://github.com/SamKirkland/FTP-Deploy-Action
or add a badge 🏷️ to your projects readme --> https://github.com/SamKirkland/FTP-Deploy-Action#badge
Using the following excludes filters: ["**/.git*","**/.github/**"]
Creating local state at ./root-deploy/.ftp-deploy-sync-state.json
Local state created
Connected to ***:*** (No encryption)
< 220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------
220-You are user number 1 of 150 allowed.
220-Local time is now 04:50. Server port: ***.
220 You will be disconnected after 15 minutes of inactivity.

> AUTH TLS
< 234 AUTH TLS OK.

Control socket is using: TLSv1.3
> OPTS UTF8 ON
< 504 Unknown command

Login security: TLSv1.3
> USER ***
< 331 User *** OK. Password required

> PASS ###
< 230 OK. Current restricted directory is /

> FEAT
< ***1-Extensions supported:
 UTF8
 EPRT
 IDLE
 MDTM
 SIZE
 MFMT
 REST STREAM
 MLST type*;size*;sizd*;modify*;UNIX.mode*;UNIX.uid*;UNIX.gid*;unique*;
 MLSD
 PRET
 AUTH TLS
 PBSZ
 PROT
 TVFS
 ESTA
 PASV
 EPSV
 ESTP

< ***1 End.

> TYPE I
< 200 TYPE is now 8-bit binary

> STRU F
< 200 F OK

> OPTS UTF8 ON
< 504 Unknown command

> OPTS MLST type;size;modify;unique;unix.mode;unix.owner;unix.group;unix.ownername;unix.groupname;
< 200  MLST OPTS type;size;sizd;modify;UNIX.mode;UNIX.uid;UNIX.gid;unique;

> PBSZ 0
< 200 PBSZ=0

> PROT P
< 200 Data protection level set to "private"

  changing dir to ./
> MKD .
< 550 Can't create directory: File exists

> CWD .
< 250 OK. Current directory is /

  dir changed
Trying to find optimal transfer strategy...
> EPSV
< 229 Extended Passive mode OK (|||34973|)

Optimal transfer strategy found.
> RETR .ftp-deploy-sync-state.json
< 550 Can't open .ftp-deploy-sync-state.json: No such file or directory

----------------------------------------------------------------
No file exists on the server "./.ftp-deploy-sync-state.json" - this must be your first publish! 🎉
The first publish will take a while... but once the initial sync is done only differences are published!
If you get this message and its NOT your first publish, something is wrong.
----------------------------------------------------------------
Local Files:	2
Server Files:	0
----------------------------------------------------------------
Calculating differences between client & server
----------------------------------------------------------------
📄 Upload: .htaccess
📄 Upload: index.php
----------------------------------------------------------------
Making changes to 2 files/folders to sync server state
Uploading: 5.69 kB -- Deleting: 0 B -- Replacing: 0 B
----------------------------------------------------------------
uploading ".htaccess"
> EPSV
< 229 Extended Passive mode OK (|||43615|)

> STOR .htaccess
< 150 Accepted data connection

Uploading to ***:43615 (TLSv1.3)
upload progress for ".htaccess". Progress: 0 bytes of 0 bytes
upload progress for ".htaccess". Progress: 5620 bytes of 5620 bytes
< 226-File successfully transferred

< 226 0.001 seconds (measured here), 7.47 Mbytes per second

  file uploaded
uploading "index.php"
> EPSV
< 229 Extended Passive mode OK (|||49839|)

> STOR index.php
< 150 Accepted data connection

Uploading to ***:49839 (TLSv1.3)
upload progress for "index.php". Progress: 0 bytes of 5620 bytes
upload progress for "index.php". Progress: 70 bytes of 5690 bytes
< 226-File successfully transferred

< 226 0.000 seconds (measured here), 173.45 Kbytes per second

  file uploaded
----------------------------------------------------------------
🎉 Sync complete. Saving current server state to "./.ftp-deploy-sync-state.json"
> EPSV
< 229 Extended Passive mode OK (|||31274|)

> STOR .ftp-deploy-sync-state.json
< 150 Accepted data connection

Uploading to ***:31274 (TLSv1.3)
upload progress for ".ftp-deploy-sync-state.json". Progress: 0 bytes of 5690 bytes
upload progress for ".ftp-deploy-sync-state.json". Progress: 753 bytes of 6443 bytes
< 226-File successfully transferred

< 226 0.000 seconds (measured here), 2.42 Mbytes per second

> QUIT
----------------------------------------------------------------
Time spent hashing: 7 milliseconds
Time spent connecting to server: 3.1 seconds
Time spent deploying: 2.4 seconds (2.35 kB/second)
  - changing dirs: 405 milliseconds
  - logging: 15 milliseconds
----------------------------------------------------------------
Total time: 6.6 seconds
----------------------------------------------------------------
5s
Run SamKirkland/FTP-Deploy-Action@v4.3.5
----------------------------------------------------------------
🚀 Thanks for using ftp-deploy. Let's deploy some stuff!   
----------------------------------------------------------------
If you found this project helpful, please support it
by giving it a ⭐ on Github --> https://github.com/SamKirkland/FTP-Deploy-Action
or add a badge 🏷️ to your projects readme --> https://github.com/SamKirkland/FTP-Deploy-Action#badge
Using the following excludes filters: ["**/.git*","**/.github/**","**/node_modules/**","**/*.log","**/.env*","**/*.map"]
Creating local state at ./dist/.ftp-deploy-sync-state.json
Local state created
Connected to ***:*** (No encryption)
< 220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------
220-You are user number 1 of 150 allowed.
220-Local time is now 04:51. Server port: ***.
220 You will be disconnected after 15 minutes of inactivity.

> AUTH TLS
< 234 AUTH TLS OK.

Control socket is using: TLSv1.3
> OPTS UTF8 ON
< 504 Unknown command

Login security: TLSv1.3
> USER ***
< 331 User *** OK. Password required

> PASS ###
< 230 OK. Current restricted directory is /

> FEAT
< ***1-Extensions supported:
 UTF8
 EPRT
 IDLE
 MDTM
 SIZE
 MFMT
 REST STREAM
 MLST type*;size*;sizd*;modify*;UNIX.mode*;UNIX.uid*;UNIX.gid*;unique*;
 MLSD
 PRET
 AUTH TLS
 PBSZ
 PROT
 TVFS
 ESTA
 PASV
 EPSV
 ESTP

< ***1 End.

> TYPE I
< 200 TYPE is now 8-bit binary

> STRU F
< 200 F OK

> OPTS UTF8 ON
< 504 Unknown command

> OPTS MLST type;size;modify;unique;unix.mode;unix.owner;unix.group;unix.ownername;unix.groupname;
< 200  MLST OPTS type;size;sizd;modify;UNIX.mode;UNIX.uid;UNIX.gid;unique;

> PBSZ 0
< 200 PBSZ=0

> PROT P
< 200 Data protection level set to "private"

  changing dir to /dist/
> CWD /
< 250 OK. Current directory is /

> MKD dist
< 550 Can't create directory: File exists

> CWD dist
< 250 OK. Current directory is /dist

  dir changed
Trying to find optimal transfer strategy...
> EPSV
< 229 Extended Passive mode OK (|||48590|)

Optimal transfer strategy found.
> RETR .ftp-deploy-sync-state.json
< 150-Accepted data connection

< 150 8.2 kbytes to download

Downloading from ***:48590 (TLSv1.3)
download progress for ".ftp-deploy-sync-state.json". Progress: 0 bytes of 0 bytes
< 226-File successfully transferred

< 226 0.000 seconds (measured here), 56.99 Mbytes per second

download progress for ".ftp-deploy-sync-state.json". Progress: 84*** bytes of 84*** bytes
----------------------------------------------------------------
Last published on 📅 Monday, March 30, 2026 at 10:35 AM
----------------------------------------------------------------
Local Files:	40
Server Files:	40
----------------------------------------------------------------
Calculating differences between client & server
----------------------------------------------------------------
⚖️  File content is the same, doing nothing: 404.html
⚖️  File content is the same, doing nothing: asset-manifest.json
⚖️  File content is the same, doing nothing: assets/css/551.bd8476c0.chunk.css
⚖️  File content is the same, doing nothing: assets/css/common.f395f3da.chunk.css
⚖️  File content is the same, doing nothing: assets/css/main.fdad73c7.css
⚖️  File content is the same, doing nothing: assets/images/asgard_logo.38790261.svg
⚖️  File content is the same, doing nothing: assets/images/columbia_taping_tools_logo.2cce4b5a.svg
⚖️  File content is the same, doing nothing: assets/images/graco_logo.f79c3fbc.svg
⚖️  File content is the same, doing nothing: assets/images/logo2.5b5286f8.svg
⚖️  File content is the same, doing nothing: assets/images/surpro_logo.6fe699bd.svg
⚖️  File content is the same, doing nothing: assets/images/tapetech_logo.24449b0c.svg
⚖️  File content is the same, doing nothing: assets/js/107.cfe47830.chunk.js
⚖️  File content is the same, doing nothing: assets/js/118.4ac144dd.chunk.js
⚖️  File content is the same, doing nothing: assets/js/177.46014d3e.chunk.js
⚖️  File content is the same, doing nothing: assets/js/187.ee3f8c24.chunk.js
⚖️  File content is the same, doing nothing: assets/js/429.f10f3f16.chunk.js
⚖️  File content is the same, doing nothing: assets/js/462.b12fd91f.chunk.js
⚖️  File content is the same, doing nothing: assets/js/472.d5f785a4.chunk.js
⚖️  File content is the same, doing nothing: assets/js/492.5c4d8388.chunk.js
⚖️  File content is the same, doing nothing: assets/js/551.c56cd2f4.chunk.js
⚖️  File content is the same, doing nothing: assets/js/657.07735132.chunk.js
⚖️  File content is the same, doing nothing: assets/js/812.ceb17d24.chunk.js
⚖️  File content is the same, doing nothing: assets/js/822.291e2acb.chunk.js
⚖️  File content is the same, doing nothing: assets/js/826.68988968.chunk.js
⚖️  File content is the same, doing nothing: assets/js/983.4fdf2754.chunk.js
⚖️  File content is the same, doing nothing: assets/js/common.31f57529.chunk.js
⚖️  File content is the same, doing nothing: assets/js/main.13b177fa.js
⚖️  File content is the same, doing nothing: assets/js/runtime.a5cfdcc3.js
⚖️  File content is the same, doing nothing: assets/js/vendor-react.8e244178.js
⚖️  File content is the same, doing nothing: assets/js/vendor.75699d50.js
⚖️  File content is the same, doing nothing: index.html
⚖️  File content is the same, doing nothing: logo-white.svg
⚖️  File content is the same, doing nothing: logo.svg
⚖️  File content is the same, doing nothing: logo2.svg
⚖️  File content is the same, doing nothing: pwa_icon.png
⚖️  File content is the same, doing nothing: vite.svg
----------------------------------------------------------------
Making changes to 0 files/folders to sync server state
Uploading: 0 B -- Deleting: 0 B -- Replacing: 0 B
----------------------------------------------------------------
----------------------------------------------------------------
🎉 Sync complete. Saving current server state to "/dist/.ftp-deploy-sync-state.json"
> EPSV
< 229 Extended Passive mode OK (|||46281|)

> STOR .ftp-deploy-sync-state.json
< 150 Accepted data connection

Uploading to ***:46281 (TLSv1.3)
upload progress for ".ftp-deploy-sync-state.json". Progress: 0 bytes of 84*** bytes
upload progress for ".ftp-deploy-sync-state.json". Progress: 84*** bytes of 16842 bytes
< 226-File successfully transferred

< 226 0.000 seconds (measured here), 29.52 Mbytes per second

> QUIT
----------------------------------------------------------------
Time spent hashing: 25 milliseconds
Time spent connecting to server: 3.1 seconds
Time spent deploying: 812 milliseconds (0 B/second)
  - changing dirs: 600 milliseconds
  - logging: 5 milliseconds
----------------------------------------------------------------
Total time: 5.3 seconds
----------------------------------------------------------------
6s
Run SamKirkland/FTP-Deploy-Action@v4.3.5
----------------------------------------------------------------
🚀 Thanks for using ftp-deploy. Let's deploy some stuff!   
----------------------------------------------------------------
If you found this project helpful, please support it
by giving it a ⭐ on Github --> https://github.com/SamKirkland/FTP-Deploy-Action
or add a badge 🏷️ to your projects readme --> https://github.com/SamKirkland/FTP-Deploy-Action#badge
Using the following excludes filters: ["**/.git*","**/.github/**","**/node_modules/**","**/*.log","**/.env*","**/.gitignore","**/README.md","**/twentytwenty*/**","**/yith-wonder/**","**/*.bak","**/*.map","**/products_catalog.csv","**/catalog/**"]
Creating local state at ./wp/wp-content/.ftp-deploy-sync-state.json
Local state created
Connected to ***:*** (No encryption)
< 220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------
220-You are user number 1 of 150 allowed.
220-Local time is now 04:51. Server port: ***.
220 You will be disconnected after 15 minutes of inactivity.

> AUTH TLS
< 234 AUTH TLS OK.

Control socket is using: TLSv1.3
> OPTS UTF8 ON
< 504 Unknown command

Login security: TLSv1.3
> USER ***
< 331 User *** OK. Password required

> PASS ###
< 230 OK. Current restricted directory is /

> FEAT
< ***1-Extensions supported:
 UTF8
 EPRT
 IDLE
 MDTM
 SIZE
 MFMT
 REST STREAM
 MLST type*;size*;sizd*;modify*;UNIX.mode*;UNIX.uid*;UNIX.gid*;unique*;
 MLSD
 PRET
 AUTH TLS
 PBSZ
 PROT
 TVFS
 ESTA
 PASV
 EPSV
 ESTP

< ***1 End.

> TYPE I
< 200 TYPE is now 8-bit binary

> STRU F
< 200 F OK

> OPTS UTF8 ON
< 504 Unknown command

> OPTS MLST type;size;modify;unique;unix.mode;unix.owner;unix.group;unix.ownername;unix.groupname;
< 200  MLST OPTS type;size;sizd;modify;UNIX.mode;UNIX.uid;UNIX.gid;unique;

> PBSZ 0
< 200 PBSZ=0

> PROT P
< 200 Data protection level set to "private"

  changing dir to /wp/wp-content/
> CWD /
< 250 OK. Current directory is /

> MKD wp
< 550 Can't create directory: File exists

> CWD wp
< 250 OK. Current directory is /wp

> MKD wp-content
< 550 Can't create directory: File exists

> CWD wp-content
< 250 OK. Current directory is /wp/wp-content

  dir changed
Trying to find optimal transfer strategy...
> EPSV
< 229 Extended Passive mode OK (|||46912|)

Optimal transfer strategy found.
> RETR .ftp-deploy-sync-state.json
< 150 Accepted data connection

Downloading from ***:46912 (TLSv1.3)
download progress for ".ftp-deploy-sync-state.json". Progress: 0 bytes of 0 bytes
< 226-File successfully transferred

< 226 0.000 seconds (measured here), 23.22 Mbytes per second

download progress for ".ftp-deploy-sync-state.json". Progress: 2455 bytes of 2455 bytes
----------------------------------------------------------------
Last published on 📅 Monday, March 30, 2026 at 10:35 AM
----------------------------------------------------------------
Local Files:	12
Server Files:	12
----------------------------------------------------------------
Calculating differences between client & server
----------------------------------------------------------------
⚖️  File content is the same, doing nothing: mu-plugins/dtb-cors.php
⚖️  File content is the same, doing nothing: mu-plugins/dtb-schematics-api.php
⚖️  File content is the same, doing nothing: themes/drywall-toolbox/functions.php
⚖️  File content is the same, doing nothing: themes/drywall-toolbox/index.php
⚖️  File content is the same, doing nothing: themes/drywall-toolbox/style.css
⚖️  File content is the same, doing nothing: themes/headless-base/functions.php
⚖️  File content is the same, doing nothing: themes/headless-base/index.php
⚖️  File content is the same, doing nothing: themes/headless-base/style.css
----------------------------------------------------------------
Making changes to 0 files/folders to sync server state
Uploading: 0 B -- Deleting: 0 B -- Replacing: 0 B
----------------------------------------------------------------
----------------------------------------------------------------
🎉 Sync complete. Saving current server state to "/wp/wp-content/.ftp-deploy-sync-state.json"
> EPSV
< 229 Extended Passive mode OK (|||32365|)

> STOR .ftp-deploy-sync-state.json
< 150 Accepted data connection

Uploading to ***:32365 (TLSv1.3)
upload progress for ".ftp-deploy-sync-state.json". Progress: 0 bytes of 2455 bytes
upload progress for ".ftp-deploy-sync-state.json". Progress: 2455 bytes of 4910 bytes
< 226-File successfully transferred

< 226 0.000 seconds (measured here), 5.96 Mbytes per second

> QUIT
----------------------------------------------------------------
Time spent hashing: 12 milliseconds
Time spent connecting to server: 3 seconds
Time spent deploying: 799 milliseconds (0 B/second)
  - changing dirs: 993 milliseconds
  - logging: 5 milliseconds
----------------------------------------------------------------
Total time: 5.7 seconds
----------------------------------------------------------------
0s
Run echo "────────────────────────────────────────────"
────────────────────────────────────────────
  Deploy status : success
  Commit SHA    : 45bc9097be0496ea716e4cfcc000cf592075ed39
  Triggered by  : elliotttmiller
  Timestamp     : 2026-03-30T10:51:14Z
  Dry run       : false
  JS chunks     : 19 files
  WP theme      : wp/wp-content/themes/headless-base/ (active headless theme)
  Root .htaccess: .htaccess → website root (React Router + WP routing)
────────────────────────────────────────────
0s
Post job cleanup.
/usr/bin/git version
git version 2.53.0
Temporarily overriding HOME='/home/runner/work/_temp/b40745af-f65c-4b08-bb9c-51847593b343' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/drywall-toolbox/drywall-toolbox
/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
http.https://github.com/.extraheader
/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url





Current runner version: '2.333.0'
Runner Image Provisioner
Operating System
Runner Image
GITHUB_TOKEN Permissions
Secret source: Actions
Prepare workflow directory
Prepare all required actions
Complete job name: Post-Deploy Verification
31s
Run URL="https://drywalltoolbox.com/dist/index.html"
Probing: https://drywalltoolbox.com/dist/index.html
Attempt 1 — HTTP 404
Attempt 2 — HTTP 404
Attempt 3 — HTTP 404
⚠ dist/index.html not reachable after 3 attempts (status 404).
0s
Run code=$(curl -s -o /dev/null -w "%{http_code}" "https://drywalltoolbox.com/" || echo "000")
  
Homepage HTTP status: 200
✓ Homepage is reachable.
3s
Run code=$(curl -s -o /dev/null -w "%{http_code}" "https://drywalltoolbox.com/wp/wp-json/" || echo "000")
  
WP REST API HTTP status: 404
⚠ WordPress REST API returned status 404.
0s
Cleaning up orphan processes