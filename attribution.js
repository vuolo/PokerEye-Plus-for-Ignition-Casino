const ATTRIBUTION_STRING =
  "PokerEye+ (Plus) for Ignition Casino - engineered by Michael Vuolo";

const asciiLogo = `
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
                    @                   
`;

function printAttributionStyle() {
  const divider = new Array(27).fill("=").join("");
  console.log(
    "%c%s%c%s%c%s",
    "color: magenta; font-size: 1.5em; background: black; font-weight: bold;",
    `${divider}`,
    "color: magenta; background: black;",
    `${asciiLogo}`,
    "color: magenta; font-size: 1.5em; background: black; font-weight: bold;",
    `${divider}\n${ATTRIBUTION_STRING}`
  );
}

printAttributionStyle();
