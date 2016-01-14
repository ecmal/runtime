#!/usr/bin/env bash
rm -rf out

git worktree prune
git worktree add ./out/runtime release
cd ./out/runtime
pwd
git rm -r .
./compile.sh
git add .
git commit -am 'Publish Changes';
git push -u origin
cd ../../
rm -rf out

