# p4v-html-utils
p4v html tab utils

## Prerequisites

- P4V: <https://www.perforce.com/downloads/helix-visual-client-p4v>
  - Please download latest version (latest then 2019.2/1856742)
- P4V Preferentces setting
  - Edit > Preferences, on the HTML Tools tab, select **Enable HTML Tools**. In this mode, P4V supports P4VJS.
  - Restart P4V

## How to use

### Import

1. Download p4-html-utils.xml
2. Run p4v
3. Tools > Manage Tools > HTML Tabs...
4. Import HTML Tabs... use p4-html-utils.xml
5. Done!

![](https://user-images.githubusercontent.com/5077086/108628699-b29a2280-749f-11eb-92e1-dd7ea01b7641.png)

![](https://user-images.githubusercontent.com/5077086/108628716-c5145c00-749f-11eb-9e8a-0c43ed6c8d82.png)

## Features

Currently, it provides a simple function using the p4vjs example.  
Additional updates are planned.

### Run Query (Changelist Search)

Simple changelist search feature

### Asset Dependencies

Displays metadata and recursive dependencies for a selected asset using Unreal's AssetRegistry.
