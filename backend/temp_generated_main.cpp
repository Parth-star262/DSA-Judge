#include <bits/stdc++.h>
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


int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; ++i) cin >> arr[i];

    Solution sol;
    sol.sort012(arr);

    for (int i = 0; i < n; ++i) {
      if (i) cout << " ";
      cout << arr[i];
    }
    cout << "\n";
    return 0;
}
