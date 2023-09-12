const SOFTWARE_NAME = "PokerEye+ (Plus) for Ignition Casino";
const SOFTWARE_VERSION = "1.0.0";
const AUTHOR = "Michael Vuolo";
const ASCII_LOGO = `
                    @                   
                    @                   
      @@            @            @@     
       @@                       @@      
              @@@@@@@@@@@@@             
        @@@@ @@,,,,,/@@@,,@@ @@@@       
     @@@   @@,,,*,@@@@@,,@@,@@   @@@    
  @@@     @@,@@,@@@,,,@@@,,,,@@     @@@ 
@@@       @,,,,@@,,,,,,,@@,@@,@       @@
  @@@     @@,,@,@@@@,@@@@,*@,@@     @@@ 
     @@@   @@,@(,,*@@@*,@/,,@@   @@@    
        #@@@ @@,,@@@/,,,,,@@ @@@.       
              @@@@@@@@@@@@@             
       @@                       @@      
      @@            @            @@     
                    @                   `;
const ASCII_LOGO_BORDER_Y = new Array(40).fill("=").join("");

function displayAttribution() {
  console.log(
    "%c%s%c%s%c%s",
    "color: magenta; background: black;",
    `${ASCII_LOGO_BORDER_Y}${ASCII_LOGO}\n${ASCII_LOGO_BORDER_Y}\n\n`,
    "color: magenta; font-size: 1.5em; background: black; font-weight: bold;",
    `${SOFTWARE_NAME} v${SOFTWARE_VERSION}\n`,
    "color: magenta; font-size: 1.2em; background: black; font-style: italic;",
    `\nEngineered by ${AUTHOR}`
  );
}

displayAttribution();
