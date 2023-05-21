# Todo


## For release [v1.2.0](https://github.com/Toffee1347/chaos-game/blob/main/CHANGELOG.md#v120)

### Bugs

- [x] Make inequalities work in vertex rules
- [x] Fix vertex rule bug with double operations
- [x] Test vertex rules before points are generated, to catch impossible combinations

### Features

- [x] Make the vertex rule display show full name for variables and properly format it


## Future releases

### Bugs

- [ ] Point size is incorrectly calculated when the shape type is custom

### Features

- [x] Write README
- [ ] Add saves feature which allows a user to download and upload configurations
  - [ ] This could be extended by using `localstorage` to save configurations
  - [ ] Also allows presets to be created
- [ ] Write help menu
- [ ] Update vertex rules to add conditons to each rule using a unicode arrow
- [ ] Add an OR option to vertex rules
- [ ] Optimise point displaying to cache the result as an image, then draw that image onto the canvas
- [ ] Change vertex rules to require the set equator when working with sets
- [ ] Allow for `2old` to be used in vertex rules to represent `2 * old`
