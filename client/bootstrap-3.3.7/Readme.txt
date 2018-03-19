March 19 2018
Viraj Bangari

Typically, installations of bootstrap 3.3.7 contains three directories:
- JS
- CSS
- Fonts

The reason the fonts are not included in the client/ directory is due to Bootstrap importing the fonts via '../fonts' in the CSS. This causes an issue since meteor can only serve static assets by path when they are placed in the public/ directory. Therefore, the fonts need to be placed in the public/ directory instead of client/.

This is how the twds:bootstrap meteor package handles the issue. The reason we don't use it is that it has dropped support for bootstrap version higher than 3.3.7, and meteor packages are not highly reliable in general.
