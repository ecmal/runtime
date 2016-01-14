#!/usr/bin/env bash
rm -rf out

git worktree prune
git worktree add ./out/runtime release
git rm -r .
./compile.sh
git add .
git commit
git push -u origin
