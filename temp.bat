
@echo off
cd /d "d:\Swasi\set\expense tracker"
echo R > input.txt
echo R >> input.txt
type input.txt | npm install
del input.txt
npm run dev
