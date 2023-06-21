# Todo


## Future releases

### Bugs

- [ ] Point size is incorrectly calculated when the shape type is custom
- [ ] Allow an input to be cleared without reseting it to the default value

### Features

- [x] Write README
- [x] Write help menu
- [x] Add saves feature which allows a user to download and upload configurations
  - [ ] This could be extended by using `localstorage` to save configurations
  - [ ] Also allows presets to be created
- [ ] Vertex rule imrpovments
  - [ ] Update vertex rules to add conditons to each rule using a unicode arrow
  - [ ] Add an OR option to vertex rules
  - [ ] Allow for `2old` to be used in vertex rules to represent `2 * old`
  - [ ] Allow brackets in vertex rules
  - [ ] Allow decimals in vertex rules
- [ ] Optimise point displaying to cache the result as an image, then draw that image onto the canvas
  - [ ] Allow an image to be downloaded of the shape (could link into the image cache)
- [ ] Display numbers on grid + change frequency of grid lines as you zoom in/out
- [ ] Allow user to change the colour of the points, depending on the vertex they were generated from
- [ ] Migrate project to typescript and compile with webpack


## For release [v1.3.0](https://github.com/Toffee1347/chaos-game/blob/main/CHANGELOG.md#v130)

### Features

- [x] Change vertex rules to require the set equator when working with sets
  - [x] Update help menu to explain this
  - [x] Bump saves to new version to allow for this breaking change
- [x] Change the vertex rules error message to have a link to the help section
- [x] Update help images with new vertex rules input design


## For release [v1.2.0](https://github.com/Toffee1347/chaos-game/blob/main/CHANGELOG.md#v120)

### Bugs

- [x] Make inequalities work in vertex rules
- [x] Fix vertex rule bug with double operations
- [x] Test vertex rules before points are generated, to catch impossible combinations

### Features

- [x] Make the vertex rule display show full name for variables and properly format it
