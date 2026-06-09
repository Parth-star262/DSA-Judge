const { buildExecutableCode } = require('./src/services/codeHarness');
const fs = require('fs');

const userCode = `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void sort012(vector<int>& arr) {
        int low = 0, mid = 0;
        int high = arr.size() - 1;

        while (mid <= high) {
            if (arr[mid] == 0) {
                swap(arr[low], arr[mid]);
                low++;
                mid++;
            }
            else if (arr[mid] == 1) {
                mid++;
            }
            else { // arr[mid] == 2
                swap(arr[mid], arr[high]);
                high--;
            }
        }
    }
};
`;

const out = buildExecutableCode('sort-array-0s-1s-2s', 'cpp', userCode);
console.log(out);
fs.writeFileSync('./backend/temp_generated_main.cpp', out);
console.log('\nWrote ./backend/temp_generated_main.cpp');
