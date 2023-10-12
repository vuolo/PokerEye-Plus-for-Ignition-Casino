const CALCULATE_BEST_ACTIONS = true;
const DEBUG_API_REQUESTS = false;
const TICK_RATE = 100; // ms
const LOG_PLAYER_SECONDS_LEFT_TO_MAKE_A_MOVE = false;
const ENABLE_HUD_VISIBILITY_BY_DEFAULT = true;
const SHOW_BB_BY_DEFAULT = false;
const TAILWIND_CSS_CDN_URL = "https://cdn.tailwindcss.com";
const TAILWIND_CSS_CUSTOM_CONFIG = {
  corePlugins: {
    preflight: false,
  },
  // prefix: 'tw-',
  important: true,
};
const INITIAL_MENU_POSITION = {
  left: "20px",
  top: "20px",
};

// TODO: To get postflop oods on a given hand, in any situation:
//  1. Create a Node.js script that opens a headless browser window to https://www.pokernews.com/poker-tools/poker-odds-calculator.htm
//   1.1 Once loaded, sync (setInterval search for) the <iframe> tag with id="oddsCalculatorIframe" and store it's "src" attribute in a variable.
//  2. Open a new headless iframe of the src from step 1.1
//   2.1 Once loaded, create a new instance of a class "postflopOddsCalc" and pass this.document as the argument (must be already loaded and ready to be passed in) and store it as this.doc within the class.
//  3. Create a function in the PokerTable class (in this script, not the Node.js script) that parses the board, number of other active players, and the user's hand to the format that the calculator expects as input
//   • Example calculator input: "8h|9c|3|5d|7c|5h|Tc||1|1", where the first elements (separated by "|") are the user's hand, the next element is the number of other active players, then the 5 cards on the board, the last two elements are usually "1" and "1" (not sure what they are for, so ignore them)
//  4. Send the parsed input from step 3 to the calculator (communicating by localhost API hosted by the Node.js script) and wait for the calculator to finish calculating the percentages
//   4.1 (for the Node.js script) The API URL to fetch data from is `https://th.odds.pokernews.com/game-probs?input=${parsedInput}`,
//       where input is the translated hand and board from step 4 in the form of "8h|9c|3|5d|7c|5h|Tc||1|1",
//       then url-encoded to be "8h%7C9c%7C3%7C5d%7C7c%7C5h%7CTc%7C%7C1%7C1"
//         • Example fetch script:
//         ```javascript
//           let url = `https://th.odds.pokernews.com/game-probs?input=${parsedInput}`,
//
//           // Fetch options
//           let options = {
//             headers: {
//               "accept": "application/json, text/plain, */*",
//               "accept-language": "en-US,en;q=0.9",
//               "sec-ch-ua": "\"Not)A;Brand\";v=\"24\", \"Chromium\";v=\"116\"",
//               "sec-ch-ua-mobile": "?0",
//               "sec-ch-ua-platform": "\"macOS\"",
//               "sec-fetch-dest": "empty",
//               "sec-fetch-mode": "no-cors",
//             },
//             referrer: "https://th.odds.pokernews.com",
//             referrerPolicy: "strict-origin-when-cross-origin",
//             body: null,
//             method: "GET",
//             mode: "no-cors", // Set the mode to 'no-cors' to disable CORS
//             credentials: "include"
//           };
//
//           // Calculate the percentages and return the response
//           fetch(url, options)
//             .then(response => response.text())
//             .then(body => {
//               console.log(body);
//               TODO: return the response...
//              })
//             .catch(error => console.error('Error:', error));
//        ```
//        • Example response:
//        ```xml
//          <?xml
//           version="1.0" encoding="utf-8"?>
//           <d>
//               <win>18.45|80.23</win>
//               <tie>1.31|4.43</tie>
//               <r>|52.13|26.1|4.36|17.41||||;|9.41|53.67|15.81|3.23|2.02|14.96|0.9|</r>
//               <c>1|1|0|1|1|1|0|1|1|1|0|1|91|92|81|92|1|1||1|33|32||32|30||26|29|1|1||1|91|92|82|91|1||0||0|0|0|0|0|0|0|0|0|0|0|0</c>
//               <time>0.116069078445</time>
//           </d>
//        ```
//         • The first number in the "win" tag is the win percentage for the user's player, the second number is the win percentage for the other players (separator is "|")
//         • The first number in the "tie" tag is the tie percentage for the user's player, the second number is the tie percentage for the other players (separator is "|")
//         • The "r" tag is the percentages for each possible hand rank (separated by "|" and the user percentages are to the left of ";" and the other player's percentages are to the right of ";" ) it is in the following order: HIGH CARD | ONE PAIR | TWO PAIR | THREE-OF-A-KIND | STRAIGHT | FLUSH | FULL HOUSE | FOUR-OF-A-KIND | STRAIGHT FLUSH
//         • The "c" is unknown as of now... so ignore it
//         • The "time" tag is the time it took to calculate the percentages (in seconds)
//  5. Parse the response, store it in the pokerTable instance accordingly
//   • The HUD should already be listening for these changes, so it should update automatically and display the percentages on the screen!
// ----------------------------------------------------------------------------------------------------------------------------------------

// TODO: To get the best preflop move on a given hand, in any situation (up to 4-bets):
//  1. Add another API endpoint to the Node.js script we wrote for postflop odds (see above) but for preflop odds (/calculate-preflop-odds)
//   1.1 The logic for this is very difficult to explain shortly... but use the /data folder and the logic from /preflop-academy to figure out how to calculate the best preflp move
//  2. Translate the hand and board to the format that the calculator expects as input (see above)
//    2.1 Format the hand to show "o" for offsuit and "s" for suited (e.g. "AKo" or "AKs")
//    2.2 Then, pass the formmatted translated hand and the player's position and circumstance (whoever raised last, and whether it was a normal raise, 3-bet, or 4-bet (e.g. { position: "BTN", action: "RAISE" }, or { position: "CO", action: "3-BET" }, or { position: "SB", action: "4-BET" })) to the API endpoint we created in step 1
//  3. Parse the response, store it in the pokerTable instance accordingly
//   • The HUD should already be listening for these changes, so it should update automatically and display the best preflop move on the screen!
// ----------------------------------------------------------------------------------------------------------------------------------------------

// TODO: add a "disconnected" state to the pokerTable instance and display it on the HUD when the player is disconnected. When reconnected, the pokerTable instance should be updated accordingly AND REINITIALIZE THE POKERTABLE INSTANCE (because the DOM will be different)

class HUD {
  constructor(pokerTable) {
    this.pokerTable = pokerTable;

    this.init();
  }

  init() {
    this.id = generateUUID();
    this.isCreated = undefined;
    this.isVisible = ENABLE_HUD_VISIBILITY_BY_DEFAULT;
    this.showBB = SHOW_BB_BY_DEFAULT;

    this.myPlayer = undefined;
    this.menuPosition = INITIAL_MENU_POSITION;

    logMessage(`${this.pokerTable.logMessagePrefix}Initializing HUD...`, {
      color: "cyan",
    });

    this.syncDOM();
  }

  importTailwindCSS() {
    // Check if Tailwind CSS is already imported
    for (const script of this.doc.scripts)
      if (script.src.includes(TAILWIND_CSS_CDN_URL)) return;

    // Import Tailwind CSS
    const importScript = this.doc.createElement("script");
    importScript.src = TAILWIND_CSS_CDN_URL;
    this.doc.head.appendChild(importScript);

    // Add the Tailwind CSS custom configuation
    const checkTailwindLoaded = setInterval(() => {
      if (!this.doc?.defaultView?.tailwind) return;
      clearInterval(checkTailwindLoaded);

      this.doc.defaultView.tailwind.config = TAILWIND_CSS_CUSTOM_CONFIG;
    }, TICK_RATE);

    logMessage(`${this.pokerTable.logMessagePrefix}Imported Tailwind CSS.`, {
      color: "cyan",
    });
  }

  close() {
    this.stopSyncingDOM();
    this.hideBBs();
    this.removeHUD();
  }

  syncDOM(runInstantly = true) {
    if (runInstantly) this.getDOM();
    this.syncDOMInterval = setInterval(() => this.getDOM(), TICK_RATE);
  }

  stopSyncingDOM() {
    clearInterval(this.syncDOMInterval);
  }

  getDOM() {
    try {
      this.doc = this.pokerTable.doc;
      this.root = this.doc.getElementById("root");

      // Get wrappers and containers
      this.tableWrapper = Array.from(this.doc.querySelectorAll("div")).find(
        (div) => div.style.display === "contents"
      );
      this.tableContainer = Array.from(this.tableWrapper.children)
        .filter((child) => child.id !== "PokerEyePlus-menu")
        .slice(-2)[0];
      this.footerContainer = Array.from(this.tableWrapper.children)
        .filter((child) => child.id !== "PokerEyePlus-menu")
        .pop();

      // Get Ignition's switch styling
      // e.g. <div class="f1d4v63a f10grhtg"><div class="f1a9vlrz"><div class="f1rgt9db"><div class="f1wig6fb"><div class="fg407x7"></div></div><div>Mute side notifications</div></div></div><i class="icon-component icon-send-message fqm6o4r Desktop smile" style="color: rgb(255, 255, 255); cursor: pointer;"></i></div>
      this.ignitionSwitchConainer = Array.from(
        this.doc
          .querySelector('div[data-qa="rightSidePanel"]')
          .querySelectorAll("div")
      ).find((div) => div.innerHTML === "Mute side notifications").parentNode;
      this.ignitionSwitchContainerClassName =
        this.ignitionSwitchConainer.className;
      this.ignitionSwitchBarClassName =
        this.ignitionSwitchConainer.querySelector("div").classList[0];
      this.ignitionSwitchButtonClassName = this.ignitionSwitchConainer
        .querySelector(`.${this.ignitionSwitchBarClassName}`)
        .querySelector("div").classList[0];

      // Ready to create the HUD
      if (!this.isCreated) this.createHud();
      else {
        // Refresh the toggleVisibilitySwitch if it disappeared
        if (!this.doc.querySelector("#PokerEyePlus-toggleVisibilitySwitch")) {
          this.removeHUD({ toggleVisibilitySwitch: true });
          this.createToggleVisibilitySwitch();
        }

        // Refresh the pokerEyeMenu if it disappeared
        if (!this.doc.querySelector("#PokerEyePlus-menu")) {
          this.removeHUD({ pokerEyeMenu: true });
          this.createPokerEyeMenu();
        }

        // Refresh the HUD menu data
        this.createPokerEyeMenu(true);
        if (this.isMenuOffScreen()) this.resetMenuPosition();

        // Refresh the shown BB for each player (if this.showBB is true)
        if (this.showBB) this.displayBBs();
      }
    } catch (error) {
      console.error(error);
      this.removeHUD();

      // Waiting for the table DOM to be ready...
      if (this.isCreated === undefined)
        logMessage(
          `${this.pokerTable.logMessagePrefix}Waiting for the HUD DOM to be ready...`,
          { color: "cyan" }
        );
      this.isCreated = false;
    } // The table DOM is not ready yet... (this happens when we join a table)
  }

  createHud() {
    this.removeHUD();
    this.importTailwindCSS();

    this.createToggleVisibilitySwitch();
    this.createPokerEyeMenu();

    logMessage(
      `${this.pokerTable.logMessagePrefix}HUD created. Click the switch to toggle visibility.`,
      { color: "cyan" }
    );
    this.isCreated = true;
  }

  removeHUD(options = { toggleVisibilitySwitch: true, pokerEyeMenu: true }) {
    if (options.toggleVisibilitySwitch)
      this.doc
        ?.querySelectorAll("#PokerEyePlus-toggleVisibilitySwitch")
        ?.forEach((node) => node.remove());
    if (options.pokerEyeMenu)
      this.doc
        ?.querySelectorAll("#PokerEyePlus-menu")
        ?.forEach((node) => node.remove());
  }

  displayBBs() {
    // Convert all player balances to BBs
    for (const player of this.pokerTable.players.values()) {
      const balanceElement = player.dom.querySelector(
        'span[data-qa="playerBalance"]'
      );
      if (!balanceElement) continue;

      // Store the initial dimensions of the balance element
      const initialWidth = balanceElement.offsetWidth;
      const initialHeight = balanceElement.offsetHeight;

      const balanceWithBB = `<span id="PokerEyePlus-originalBalance" class="max-w-[0px] overflow-hidden max-h-[0px] text-white text-[0rem]">${
        this.pokerTable.currencySymbol
      }${formatCurrencyLikeIgnition(roundFloat(player.balance || 0))}</span>${
        player.numBigBlinds
          ? `<span id="PokerEyePlus-numBigBlinds" class="min-w-[inherit]">${formatCurrencyLikeIgnition(
              roundFloat(player.numBigBlinds, 1, false),
              false
            )} BB</span>`
          : "0 BB"
      }`;
      if (balanceElement.innerHTML !== balanceWithBB)
        balanceElement.innerHTML = balanceWithBB;
    }

    // TODO: Convert all pots (total, main, all side pots) to BBs

    // TODO: Convert all current bets to BBs
  }

  hideBBs() {
    // Revert all player balances to their original state
    for (const player of this.pokerTable.players.values()) {
      const balanceElement = player.dom.querySelector(
        'span[data-qa="playerBalance"]'
      );
      if (!balanceElement) continue;

      const balanceWithoutBB = `${
        this.pokerTable.currencySymbol
      }${formatCurrencyLikeIgnition(roundFloat(player.balance || 0))}`;
      if (balanceElement.innerHTML !== balanceWithoutBB)
        balanceElement.innerHTML = balanceWithoutBB;
    }

    // TODO: Revert all pots (total, main, all side pots) to their original state

    // TODO: Revert all current bets to their original state
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.updateVisibilitySwitchStyling();

    logMessage(
      `${this.pokerTable.logMessagePrefix}HUD visibility toggled ${
        this.isVisible ? "on" : "off"
      }`,
      { color: "cyan" }
    );
  }

  // Place the switch in the bottom right corner of the screen
  createToggleVisibilitySwitch() {
    const container = this.doc.createElement("div");
    container.id = "PokerEyePlus-toggleVisibilitySwitch";
    container.className = `${this.ignitionSwitchContainerClassName} absolute right-0 bottom-0 m-1 p-2 cursor-pointer text-sm text-[#E3E3E3]`;
    container.innerHTML = `
      <div class="${this.ignitionSwitchBarClassName}">
        <div class="${this.ignitionSwitchButtonClassName}"></div>
      </div>
      <div class="mt-[1px]">PokerEye+</div>
    `;
    this.toggleVisibilitySwitch = container;

    container.addEventListener("click", () => this.toggleVisibility());
    this.updateVisibilitySwitchStyling();

    this.footerContainer.appendChild(container);
  }

  updateVisibilitySwitchStyling() {
    const bar = this.toggleVisibilitySwitch.querySelector(
      `.${this.ignitionSwitchBarClassName}`
    );
    const button = this.toggleVisibilitySwitch.querySelector(
      `.${this.ignitionSwitchButtonClassName}`
    );
    if (this.isVisible) {
      bar.classList.add("switchedOn");
      button.classList.add("switchedOn");
    } else {
      bar.classList.remove("switchedOn");
      button.classList.remove("switchedOn");
    }
  }

  toggleShowBB() {
    this.showBB = !this.showBB;
    this.updateShowBBSwitchStyling();

    if (!this.showBB) this.hideBBs();

    logMessage(
      `${this.pokerTable.logMessagePrefix}Show BB toggled ${
        this.showBB ? "on" : "off"
      }`,
      { color: "cyan" }
    );
  }

  createToggleShowBBSwitch() {
    const container = this.doc.createElement("div");
    container.id = "PokerEyePlus-toggleShowBBSwitch";
    container.className = `${this.ignitionSwitchContainerClassName} cursor-pointer text-sm font-bold`;
    container.innerHTML = `
      <div class="${this.ignitionSwitchBarClassName}">
        <div class="${this.ignitionSwitchButtonClassName}"></div>
      </div>
      <div class="mt-[1px]">Show BB</div>
    `;
    this.toggleShowBBSwitch = container;

    container.addEventListener("click", () => this.toggleShowBB());
    this.updateShowBBSwitchStyling();

    return container;
  }

  updateShowBBSwitchStyling() {
    const bar = this.toggleShowBBSwitch.querySelector(
      `.${this.ignitionSwitchBarClassName}`
    );
    const button = this.toggleShowBBSwitch.querySelector(
      `.${this.ignitionSwitchButtonClassName}`
    );
    if (this.showBB) {
      bar.classList.add("switchedOn");
      bar.classList.remove("bg-red-200");
      button.classList.add("switchedOn");
    } else {
      bar.classList.remove("switchedOn");
      bar.classList.add("bg-red-200");
      button.classList.remove("switchedOn");
    }
  }

  // PokerEye+ main menu (only shows when this.isVisible)
  // An easy-to-use Chrome extension that records & calculates statistics while playing on Ignition Casino's Online Poker in your browser.
  createPokerEyeMenu(refreshOnly = false) {
    const myPlayer = this.pokerTable.players.get(
      this.pokerTable.myPlayerSeatNumber
    );
    this.myPlayer = myPlayer;

    const detailsPanel = `
      <!-- Most Recent Action -->
      <div class="flex justify-between items-center px-1 rounded-sm">
        <div class="flex flex-1 justify-start items-center">
          <span class="iconItem">
            <i class="icon-component icon-hand-history opacity-[75%]"></i>
          </span>
          <span class="ml-1.5 text-xs font-bold">${
            myPlayer.actionHistory.length > 0
              ? `${myPlayer.actionHistory[
                  myPlayer.actionHistory.length - 1
                ].action.replace(
                  " seconds left to make a move...",
                  " second(s) left..."
                )}`
              : `<span class="opacity-[75%]">...</span>`
          }</span>
        </div>
        <span class="text-[0.6rem]">${
          myPlayer.actionHistory.length > 0
            ? `${convertFormattedTimestampToAgo(
                myPlayer.actionHistory[myPlayer.actionHistory.length - 1]
                  .timestamp
              )}`
            : `<span class="opacity-[75%]">...</span>`
        }</span>
      </div>

      <!-- Hands Dealt -->
      <div class="flex justify-between items-center bg-[#F2F2F2] py-1 px-2 rounded-sm shadow-sm">
        <span class="text-xs opacity-[75%]">Hands Dealt</span>
        <span class="font-bold">${this.pokerTable.numHandsDealt}</span>
      </div>

      <!-- Balance -->
      <div class="flex justify-between items-center bg-[#F2F2F2] py-1 px-2 rounded-sm shadow-sm">
        <span class="text-xs opacity-[75%]">Balance</span>
        <span class="font-bold">${this.pokerTable.currencySymbol}${roundFloat(
      myPlayer.balance || 0
    )
      .toString()
      .replace(".00", "")} ${
      myPlayer.numBigBlinds
        ? `(${formatCurrencyLikeIgnition(
            roundFloat(myPlayer.numBigBlinds, 1, false),
            false
          )} BB)`
        : ""
    }</span>
      </div>

      <!-- Position -->
      <div class="flex justify-between items-center bg-[#F2F2F2] py-1 px-2 rounded-sm shadow-sm">
        <span class="text-xs opacity-[75%]">Position</span>
        <span class="font-bold${
          myPlayer.position === null ? " opacity-[75%]" : ""
        }">${myPlayer.position || "SITTING OUT..."}</span>
      </div>

      <!-- Hand -->
      <div class="flex justify-between items-center bg-[#F2F2F2] py-1 px-2 rounded-sm shadow-sm">
        <span class="text-xs opacity-[75%]">Hand</span>
        <span class="font-bold">${
          myPlayer.hand.length > 0
            ? myPlayer.hand.map((card) => this.renderCard(card)).join(" ")
            : `<span class="opacity-[75%]">...</span>`
        }</span>
      </div>

      <!-- Board -->
      <div class="flex justify-between items-center bg-[#F2F2F2] py-1 px-2 rounded-sm shadow-sm">
        <span class="text-xs opacity-[75%]">Board</span>
        <span class="font-bold">${
          this.pokerTable.board.length > 0
            ? this.pokerTable.board
                .map((card) => this.renderCard(card))
                .join(" ")
            : `<span class="opacity-[75%]">...</span>`
        }</span>
      </div>
    `;

    if (refreshOnly) {
      // Refresh only if the detailsPanel has changed
      if (
        this.pokerEyeMenu.querySelector("#PokerEyePlus-detailsPanel")
          .innerHTML != detailsPanel
      )
        this.pokerEyeMenu.querySelector(
          "#PokerEyePlus-detailsPanel"
        ).innerHTML = detailsPanel;

      // Refresh only if the visibility has changed
      if (this.isVisible && this.pokerEyeMenu.classList.contains("hidden"))
        this.pokerEyeMenu.classList.remove("hidden");
      else if (
        !this.isVisible &&
        !this.pokerEyeMenu.classList.contains("hidden")
      )
        this.pokerEyeMenu.classList.add("hidden");
      return;
    }

    const menu = this.doc.createElement("div");
    menu.id = "PokerEyePlus-menu";
    menu.className = `absolute min-w-[15rem] bg-white rounded-md overflow-hidden text-[#1F2E35] z-[999999]`;
    menu.style.left = this.menuPosition.left;
    menu.style.top = this.menuPosition.top;

    const container = this.doc.createElement("div");
    container.className = `flex flex-col w-full`;

    // Header
    const header = `
      <div class="flex justify-between items-center shadow-2xl border-[4rem] border-b-red-300">
        <div id="PokerEyePlus-menu-dragZone" class="flex items-center space-x-1 pl-1 w-full h-full cursor-move">
          <img src="https://i.imgur.com/ETaXEfg.png" alt="PokerEye+ Logo" class="h-8 w-8">
          <h1 class="text-lg leading-[0]">PokerEye+</h1>
        </div>
        <div id="PokerEyePlus-close-menu" class="iconItem close p-2 bg-gray-300 cursor-pointer">
          <i class="icon-component icon-close2"></i>
        </div>
      </div>
      <!-- Divider -->
      <div class="h-[1px] bg-[#CECED3]"></div>
    `;
    container.innerHTML = header;

    // Close button
    const closeMenuButton = container.querySelector("#PokerEyePlus-close-menu");
    closeMenuButton.addEventListener("click", () => this.toggleVisibility());

    // Details panel
    const detailsPanelContainer = this.doc.createElement("div");
    detailsPanelContainer.id = "PokerEyePlus-detailsPanel";
    detailsPanelContainer.className = `flex flex-col gap-1 p-2 text-sm`;
    detailsPanelContainer.innerHTML = detailsPanel;
    container.appendChild(detailsPanelContainer);

    // Undearneath the details panel container
    const underneathDetailsPanelContainer = this.doc.createElement("div");
    underneathDetailsPanelContainer.className = `flex flex-col gap-1 p-2 text-sm bg-[#F2F2F2]`;
    container.appendChild(underneathDetailsPanelContainer);

    // Show BB switch
    const showBBSwitch = this.createToggleShowBBSwitch();
    underneathDetailsPanelContainer.appendChild(showBBSwitch);

    menu.appendChild(container);
    this.pokerEyeMenu = menu;
    this.makeMenuDraggable();

    this.tableWrapper.appendChild(menu);
  }

  makeMenuDraggable() {
    const dragZone = this.pokerEyeMenu.querySelector(
      "#PokerEyePlus-menu-dragZone"
    );

    let x1 = 0;
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;

    function dragMouseDown(e) {
      e = e || this.doc.defaultView.event;
      e.preventDefault();

      x2 = e.clientX;
      y2 = e.clientY;
      this.doc.onmouseup = closeDrag.bind(this);
      this.doc.onmousemove = mouseDrag.bind(this);
    }

    function mouseDrag(e) {
      e = e || this.game.doc.defaultView.event;
      e.preventDefault();

      x1 = x2 - e.clientX;
      y1 = y2 - e.clientY;
      x2 = e.clientX;
      y2 = e.clientY;

      const left = this.pokerEyeMenu.offsetLeft - x1 + "px";
      const top = this.pokerEyeMenu.offsetTop - y1 + "px";
      this.pokerEyeMenu.style.left = left;
      this.pokerEyeMenu.style.top = top;
      this.menuPosition = { left, top };
    }

    function closeDrag() {
      this.doc.onmouseup = null;
      this.doc.onmousemove = null;
    }

    dragZone.onmousedown = dragMouseDown.bind(this);
  }

  isMenuOffScreen() {
    let rootWidth = this.root.offsetWidth;
    let rootHeight = this.root.offsetHeight;
    let menuX = parseInt(this.pokerEyeMenu.style.left, 10);
    let menuY = parseInt(this.pokerEyeMenu.style.top, 10);

    return menuX > rootWidth || menuY > rootHeight;
  }

  resetMenuPosition() {
    let rootHeight = this.root.offsetHeight;
    let seatRect = this.myPlayer?.dom?.getBoundingClientRect();
    if (!seatRect) {
      this.pokerEyeMenu.style.left = INITIAL_MENU_POSITION.left;
      this.pokerEyeMenu.style.top = INITIAL_MENU_POSITION.top;
      return;
    }

    let horizontalPosition =
      (seatRect.left * this.getTableZoom()).toString() + "px";
    this.pokerEyeMenu.style.left = horizontalPosition;

    this.pokerEyeMenu.style.top =
      seatRect.bottom * this.getTableZoom() > rootHeight / 2
        ? (seatRect.bottom * this.getTableZoom()).toString() + "px"
        : (seatRect.top * this.getTableZoom()).toString() + "px";
  }

  getTableZoom() {
    return Number(
      this.doc.querySelector('div[data-qa="table"]')?.style?.zoom || 1
    );
  }

  renderCard(card) {
    let suitIcon;
    let color = "#333";
    switch (card.slice(-1)) {
      case "c":
        suitIcon = "♣";
        break;
      case "d":
        suitIcon = "♦";
        color = "#c3161c";
        break;
      case "h":
        suitIcon = "♥";
        color = "#c3161c";
        break;
      case "s":
        suitIcon = "♠";
        break;
    }
    return `<span style="color: ${color};">${card.slice(
      0,
      -1
    )}${suitIcon}</span>`;
  }
}

class Player {
  constructor(dom, seatNumber, pokerTable) {
    this.dom = dom;
    this.seatNumber = seatNumber;
    this.pokerTable = pokerTable;

    this.init();
  }

  init() {
    this.id = generateUUID();
    this.isMyPlayer = this.dom.classList.contains("myPlayer");

    this.balance = undefined;
    this.balanceHistory = [];
    this.numBigBlinds = undefined;
    this.hand = [];
    this.actionHistory = [];
    this.actionHistoryPerHand = new Map();
    this.isTurnToAct = false;
    this.bestActions = [];
    this.position = null;

    this.logMessagePrefix = `(Table #${this.pokerTable.slotNumber}, Seat #${
      this.seatNumber
    }${this.isMyPlayer ? " - you" : ""}): `;

    this.syncPlayerInfo();
  }

  syncPlayerInfo(runInstantly = true) {
    if (runInstantly) this.getPlayerInfo();
    this.syncPlayerInfoInterval = setInterval(
      () => this.getPlayerInfo(),
      TICK_RATE
    );
  }

  stopSyncingPlayerInfo() {
    clearInterval(this.syncPlayerInfoInterval);
  }

  getPlayerInfo() {
    try {
      return {
        balance: this.getBalance(),
        hand: this.getHand(),
        currentAction: this.getCurrentAction(),
      };
    } catch (error) {
      logMessage(
        `${this.logMessagePrefix}Error getting player info: ${error}`,
        { color: "red" }
      );
      console.error(error);
    }
  }

  resetBalanceHistory() {
    this.balance = undefined;
    this.balanceHistory = [];
    this.numBigBlinds = undefined;
  }

  resetActionHistory(resetBalanceHistory = true) {
    if (resetBalanceHistory) this.resetBalanceHistory();
    this.actionHistory = [];
    this.actionHistoryPerHand = new Map();
    this.isTurnToAct = false;

    this.stopSyncingPlayerInfo();
    this.syncPlayerInfo(false);
  }

  isSittingOut = () => {
    const currentAction = this.getCurrentAction();

    return this.hand.length === 2
      ? false
      : this.actionHistory.length === 0
      ? !currentAction
        ? true
        : currentAction?.action === "SITTING OUT..."
      : this.actionHistory[this.actionHistory.length - 1].action ===
          "SITTING OUT..." ||
        this.actionHistory[this.actionHistory.length - 1].action ===
          "NEW PLAYER";
  };

  updateTurnToAct(isTurnToAct) {
    if (isTurnToAct !== this.isTurnToAct) {
      // Reset all other players' turn to act and set this player's turn to act
      for (const player of this.pokerTable.players.values())
        player.isTurnToAct = player.id === this.id ? isTurnToAct : false;

      // Check if it is my turn to act
      if (this.isTurnToAct && this.isMyPlayer) {
        // Refetch hand and position in case they aren't up to date
        this.getHand();
        this.pokerTable.updatePlayerPositions();

        if (this.hand.length === 2 && this.position !== null) {
          logMessage(`${this.logMessagePrefix}It's your turn to act.`, {
            color: "goldenrod",
          });

          if (CALCULATE_BEST_ACTIONS && this.pokerTable.firstHandDealt)
            void (async () => {
              this.bestActions = (await this.getBestActions()) ?? [];
              if (this.bestActions.length === 0)
                logMessage(
                  `${this.logMessagePrefix}> Could not calculate the best action(s) given the current scenario.`,
                  {
                    color: "cornsilk",
                    fontStyle: "italic",
                  }
                );
            })();
          else if (!this.pokerTable.firstHandDealt)
            logMessage(
              `${this.logMessagePrefix}> Cannot calculate best action(s) right now. You must wait for the next hands to be dealt for calculation accuracy.`,
              {
                color: "cornsilk",
                fontStyle: "italic",
              }
            );
        }
      } else if (!this.isTurnToAct && this.isMyPlayer) {
        this.bestActions = [];
      }
    }
  }

  getNumBigBlinds = () =>
    this.pokerTable.blinds.big !== undefined
      ? roundFloat(this.balance / this.pokerTable.blinds.big, 2, false)
      : null;

  getBestActions = async () => {
    logMessage(`${this.logMessagePrefix}Calculating best action(s)...`, {
      color: "cornsilk",
    });

    // If it is preflop, get the best preflop actions
    if (this.pokerTable.board.length === 0)
      return await this.getBestPreflopActions();
    // TODO: If it is postflop, get the best postflop actions
  };

  getBestPreflopActions = async () => {
    logMessage(`${this.logMessagePrefix}> Preflop detected.`, {
      color: "cornsilk",
    });

    // Check if another player RFI
    //  1. Loop through all players (this.pokerTable.players.values())
    //  2. Check if the player is not this player (player.id !== this.id)
    //  3. Check if the player is not sitting out (player.isSittingOut())
    //  4. Loop through the player's action history (player.actionHistory) in reverse order to find the last occurrence of "NEXT HAND"
    //  5. Check if the player's last occurrence of the "NEXT HAND" action is within 2 seconds of my last occurrence of the "NEXT HAND" action (Math.abs(player.actionHistory[i].timestamp - this.actionHistory[j].timestamp) <= 2 seconds), but note (important) the format of .timestamp is `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}.${mmm}`
    //  6. Check if the player's last action was "RAISE", "BET", or "ALL-IN" and the absolute value of action.amountBet is ≥ 2bb (action.amountBet >= 2 * this.pokerTable.blinds.big), and push them to a list stored in a map of players who RFI'd in possibleRfiActionsByPlayer, where each key is the player.id and each value is a list of possible RFI actions
    //  7. Store the earliest possible RFI action using earliestRfiActionTimestamp
    //  8. (done) Store the position of the earliest RFI action in rfiPosition
    let earliestRfiActionTimestamp = undefined;
    let earliestRfiAction = undefined;
    let rfiPosition = undefined;

    // Find my last occurrence of the "NEXT HAND" action
    const myLastNextHandIndex = this.actionHistory.findLastIndex(
      (action) => action.action === "NEXT HAND"
    );
    const myLastNextHand = this.actionHistory[myLastNextHandIndex];

    // log looking for RFI
    logMessage(`${this.logMessagePrefix}> Looking for RFI...`, {
      color: "cornsilk",
    });
    for (const player of this.pokerTable.players.values()) {
      if (!myLastNextHand || player.id === this.id || player.isSittingOut())
        continue;

      // Store the last occurrence of the "NEXT HAND" action
      const lastNextHandIndex = player.actionHistory.findLastIndex(
        (action) => action.action === "NEXT HAND"
      );
      if (lastNextHandIndex === -1) continue;
      const lastNextHand = player.actionHistory[lastNextHandIndex];

      // Check if the last occurrence of the "NEXT HAND" action is within 2 seconds of my last occurrence of the "NEXT HAND" action
      if (
        Math.abs(
          new Date(lastNextHand.timestamp) - new Date(myLastNextHand.timestamp)
        ) <=
        2 * 1000 // 2 seconds (in milliseconds)
      ) {
        // Get the player's action history since the last occurrence of their valid (matching timestamp) "NEXT HAND" action
        const splicedActionHistory = player.actionHistory.slice(
          lastNextHandIndex + 1
        );

        // Get the player's last RFI action ("RAISE", "BET", or "ALL-IN")
        const lastActionIndex = splicedActionHistory.findLastIndex(
          (action) =>
            action.action === "BET" ||
            action.action === "RAISE" ||
            action.action === "ALL-IN"
        );
        const lastAction = splicedActionHistory[lastActionIndex];

        // Check if the player's last RFI action was at least 2bb (otherwise, we consider it a limp)
        if (
          lastAction &&
          Math.abs(lastAction.amountBet) >= 2 * this.pokerTable.blinds.big
        ) {
          const actionTimestamp = new Date(lastAction.timestamp).getTime();

          // Store the earliest possible RFI action (and position)
          if (
            !earliestRfiActionTimestamp ||
            actionTimestamp < earliestRfiActionTimestamp
          ) {
            earliestRfiActionTimestamp = actionTimestamp;
            earliestRfiAction = lastAction;
            rfiPosition = player.position;
          }
        }
      }
    }

    this.pokerTable.rfiPosition = rfiPosition;
    if (rfiPosition) {
      logMessage(
        `${this.logMessagePrefix}> RFI position detected: ${rfiPosition} (${
          earliestRfiAction.action
        } $${formatCurrencyLikeIgnition(
          Math.abs(earliestRfiAction.amountBet)
        )})`,
        { color: "cornsilk" }
      );
    } else
      logMessage(`${this.logMessagePrefix} • No RFI detected.`, {
        color: "cornsilk",
      });

    // Set up the API request
    const apiUrl = new URL(
      "http://localhost:3000/api/trpc/pokerCalculations.getBestPreflopActions"
    );
    const params = new URLSearchParams(apiUrl.search);
    params.append("batch", "1");
    const input = {
      maxPlayers: "6",
      numBigBlinds: 100,
      hand: formatHandForAPI(this.hand),
      position: this.position,
      rfiPosition,
    };
    params.append("input", JSON.stringify({ 0: { json: input } }));
    apiUrl.search = params.toString();

    // Log the API request (for debugging purposes)
    if (DEBUG_API_REQUESTS) {
      logMessage(`${this.logMessagePrefix}> API Request:`, {
        color: "cornsilk",
      });
      console.log(bodyData["0"]?.json);
    }
    logMessage(
      `${this.logMessagePrefix}> Calculating the best action for the hand \`${
        input.hand
      }\` as ${input.position} (you)${
        rfiPosition ? ` versus ${rfiPosition}` : ""
      } RFI:`,
      {
        color: "cornsilk",
      }
    );

    try {
      const response = await fetch(apiUrl.toString(), {
        method: "GET",
        mode: "cors",
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const json = await response.json();
      const result = json?.[0]?.result?.data?.json?.result;
      const bestActions = result?.bestActions;

      // Log the API response (for debugging purposes)
      if (DEBUG_API_REQUESTS) {
        logMessage(`${this.logMessagePrefix}> API Response:`, {
          color: "cornsilk",
        });
        console.log(result);
      }

      // Log the best action(s)
      // type BestAction = {
      //   action: Action;
      //   percentage?: number; // e.g. 0.5 = 50%
      //   numBigBlinds: number; // e.g. 2.5 = 2.5bb, 3 = 3bb, 3.5 = 3.5bb
      // };
      logMessage(`${this.logMessagePrefix}> Best Action(s) Calculated:`, {
        color: "cornsilk",
      });
      for (const bestAction of bestActions)
        logMessage(
          `${this.logMessagePrefix} • ${bestAction.action}${
            bestAction.numBigBlinds != 0
              ? ` ($${formatCurrencyLikeIgnition(
                  bestAction.numBigBlinds * this.pokerTable.blinds.big
                )} - ${bestAction.numBigBlinds}bb)`
              : ""
          } [${roundFloat(bestAction.percentage * 100, 0)}%]`,
          {
            color: "cornsilk",
          }
        );

      return bestActions;
    } catch (error) {
      logMessage(`${this.logMessagePrefix}> Fetch Error: ${error}`, {
        color: "red",
      });
      console.error(error);
    }
  };

  getBalance() {
    const previousBalance = this.balance;

    // To get the player balance:
    //  1. Get the innerText of the <span> tag with attribute "data-qa" with value "playerBalance"
    //  2. Parse the balance text to a number and store it in a new Player instance
    //   Note: These values are formatted in the "x,xxx.xx" format (e.g."2,224.37"), but whenever the value has no decimal places, the format is "x,xxx" (e.g. "1,963")
    const balanceDOM = this.dom.querySelector('span[data-qa="playerBalance"]');
    const showBBOriginalBalance = this.dom.querySelector(
      "#PokerEyePlus-originalBalance"
    )?.innerText;
    const balanceText = showBBOriginalBalance
      ? showBBOriginalBalance
      : balanceDOM?.innerHTML;

    if (balanceText?.includes("PokerEyePlus-originalBalance"))
      return this.balance;
    const balance = parseCurrency(balanceText);
    this.balance = balance;

    // Check for the currency symbol
    if (isNaN(balanceText?.charAt(0))) {
      this.pokerTable.currencySymbol = balanceText?.charAt(0) || "";
    } else this.pokerTable.currencySymbol = "";

    // Log the balance if it has changed
    if (this.balance !== undefined && previousBalance !== this.balance) {
      this.balanceHistory.push({
        balance,
        timestamp: formatTimestamp(new Date()),
      });
      this.numBigBlinds = this.getNumBigBlinds();
      logMessage(
        `${this.logMessagePrefix}Balance updated: ${
          this.pokerTable.currencySymbol
        }${roundFloat(this.balance || 0)}${
          previousBalance !== undefined
            ? ` (net: ${this.pokerTable.currencySymbol}${roundFloat(
                this.balance - (previousBalance || 0)
              )}, previous: ${this.pokerTable.currencySymbol}${roundFloat(
                previousBalance || 0
              )})`
            : ""
        }`,
        { color: this.isMyPlayer ? "goldenrod" : "lightgray" }
      );
    }

    return this.balance;
  }

  getHand() {
    // To get hole cards DOM:
    //  1. Get all <div> tags with attribute "data-qa" with value of "holeCards"
    //  2. Now, for each of the <div> tags we got in step 1, get all <svg> tags that has an attribute of "data-qa" with a value that starts with "card"
    const holeCardsDOM = Array.from(
      Array.from(
        this.dom.querySelectorAll('div[data-qa="holeCards"]') || []
      ).map((div) => div.querySelectorAll('svg[data-qa^="card"]')) || []
    )
      .map((innerNodeList) => Array.from(innerNodeList))
      .flat();
    this.holeCardsDOM = holeCardsDOM;

    // To get hand:
    //  1. Get the "data-qa" attribute value of each <svg> tag
    //  2. Filter out all empty/placeholder cards (this is when the <svg> tag's "data-qa" attribute value equals "card-1")
    //  3. Remove all duplicate cards (by removing all duplicate "data-qa" attribute values from the <svg> tags)
    const newHand = holeCardsDOM
      .map((svg) => svg.getAttribute("data-qa"))
      .filter((card) => card !== "card-1")
      .filter((card, index, cards) => cards.indexOf(card) === index)
      .map((card) => formatCard(card))
      .filter((card) => card !== null);

    // Update the hand if they have changed
    if (JSON.stringify(newHand) !== JSON.stringify(this.hand)) {
      this.hand = newHand;
      if (this.hand.length === 0)
        logMessage(`${this.logMessagePrefix}Hand has been cleared.`, {
          color: this.isMyPlayer ? "goldenrod" : "lightblue",
        });
      else {
        logMessage(
          `${this.logMessagePrefix}Hand updated: ${this.hand
            .map((card) => `[${card}]`)
            .join(" ")}`,
          { color: this.isMyPlayer ? "goldenrod" : "lightblue" }
        );
        if (this.isMyPlayer && this.isTurnToAct) {
          this.updateTurnToAct(false);
          this.updateTurnToAct(true);
        }
      }
    }

    return this.hand;
  }

  isPutInMoneyAction(action) {
    return [
      "CALL",
      "BET",
      "RAISE",
      "POST SB",
      "POST BB",
      "ALL-IN",
      "ALL-IN · x%",
    ].some((moneyAction) => action.includes(moneyAction));
  }

  didUserPutInMoney = (action = undefined) =>
    action
      ? this.isPutInMoneyAction(action)
      : this.actionHistory[this.actionHistory.length - 1]
      ? this.isPutInMoneyAction(
          this.actionHistory[this.actionHistory.length - 1].action
        )
      : false;

  // Get a list of all player actions (e.g. "FOLD", "CHECK", "CALL", "BET", "RAISE", "ALL-IN", "ALL-IN · x%", "SITTING OUT...", "POST SB", "POST BB", "x seconds left to make a move...", "NEW PLAYER", "DONT SHOW") along with the action's timestamp (e.g. "2021-01-01 00:00:00.000")
  getCurrentAction() {
    // To get the player's current action DOM:
    //  1. Get the <div> tag with attribute "data-qa" with value "playerTag" or "myPlayerTag"
    //  2. Get the parent <div> of that <div>
    //  3. Get the first <div> tag within that <div> that does not have a "data-qa" attribute with a value of "playerTag" or "myPlayerTag" (don't check recursively, only check the first level of children)
    const currentActionDOM = this.dom
      .querySelector('div[data-qa="playerTag"], div[data-qa="myPlayerTag"]')
      ?.parentNode?.querySelector(
        ':scope > div:not([data-qa="playerTag"]):not([data-qa="myPlayerTag"])'
      );
    this.currentActionDOM = currentActionDOM;

    // Check if the player's current action DOM exists
    if (currentActionDOM) {
      // To get the player's current action:
      //  1. Within the player action DOM, there will be two <div> tags, one is has the opacity of 1 and the other has the opacity of 0, the one with opacity of 1 is the current player action
      //  2. Get the innerText of the <div> tag with style opacity of 1 within the current player action DOM, this is the current player action (note: the style tag may have other styles, e.g. style="opacity: 1; transition: opacity 600ms ease 0s;", so we can't just check if the style tag equals "opacity: 1", we have to check if it contains "opacity: 1")
      const currentAction = this.formatAction(
        Array.from(currentActionDOM.querySelectorAll("div")).find(
          (div) => div.style.opacity === "1"
        )?.innerText
      );

      // Check if the player's current action is different from the previous action (also sift through "NEXT HAND" and startsWith("POSITION UPDATED") actions)
      if (
        !currentAction ||
        (this.actionHistory.length > 0 &&
          this.actionHistory[this.actionHistory.length - 1].action ===
            currentAction) ||
        this.actionHistory[
          this.actionHistory.findLastIndex(
            (action) =>
              action.action !== "NEXT HAND" &&
              !action.action.startsWith("POSITION UPDATED")
          )
        ]?.action === currentAction
      )
        return this.actionHistory[this.actionHistory.length - 1] || null;

      // Create an action object
      const action = {
        action: currentAction,
        amountBet: this.isPutInMoneyAction(currentAction)
          ? this.balanceHistory.length >= 2
            ? roundFloat(
                this.balance -
                  this.balanceHistory[this.balanceHistory.length - 2].balance,
                2,
                false
              )
            : this.balanceHistory.length === 1
            ? roundFloat(
                this.balance - this.balanceHistory[0].balance,
                2,
                false
              )
            : 0
          : undefined,
        timestamp: formatTimestamp(new Date()),
      };

      // Update balance history
      if (this.isPutInMoneyAction(currentAction)) {
        this.balanceHistory[this.balanceHistory.length - 1] = {
          ...this.balanceHistory[this.balanceHistory.length - 1],
          netDifference: action.amountBet,
          action: currentAction,
        };
      }

      // Add the action object to the actionHistory array
      this.actionHistory.push(action);
      this.actionHistoryPerHand.set(
        this.pokerTable.numHandsDealt,
        this.actionHistoryPerHand.get(this.pokerTable.numHandsDealt)
          ? [
              ...this.actionHistoryPerHand.get(this.pokerTable.numHandsDealt),
              action,
            ]
          : [action]
      );
      this.updateTurnToAct(
        currentAction.includes("seconds left to make a move...") ? true : false
      );
      if (
        LOG_PLAYER_SECONDS_LEFT_TO_MAKE_A_MOVE ||
        !currentAction.includes("seconds left to make a move...")
      ) {
        logMessage(
          `${this.logMessagePrefix}> ${currentAction} (at ${action.timestamp})`,
          {
            color: this.isMyPlayer
              ? "goldenrod"
              : currentAction.includes("seconds left to make a move...")
              ? "lightgray"
              : "lightblue",
          }
        );
      }

      return action;
    }

    return null;
  }

  formatAction(action, removeDetails = true) {
    const formattedAction =
      // Check if the action is just a number (e.g. "7" for "7 seconds left to make a move")
      !isNaN(action) ? `${action} seconds left to make a move...` : action;
    return (
      formattedAction === " seconds left to make a move..."
        ? "SITTING OUT..."
        : formattedAction === "SITTING OUT"
        ? "SITTING OUT..."
        : formattedAction
    ).split(removeDetails ? " · " : undefined)[0];
  }
}

class PokerTable {
  constructor(iframe, slotNumber) {
    this.iframe = iframe;
    this.slotNumber = slotNumber;

    this.init();
  }

  init() {
    this.id = generateUUID();
    this.doc = this.iframe.contentWindow?.document;
    this.firstHandDealt = false;
    this.isClosing = false;

    this.blinds = {
      small: undefined,
      big: undefined,
    };
    this.gameType = undefined;
    this.board = [];
    this.numHandsDealt = 0;
    this.players = new Map();
    this.currencySymbol = "";
    this.rfiPosition = undefined;

    this.totalPot = undefined;
    this.mainPot = undefined;
    this.sidePots = [];

    this.logMessagePrefix = `(Table #${this.slotNumber}): `;
    displayAttribution();

    this.syncTableInfo();
    this.hud = new HUD(this);
  }

  close() {
    this.isClosing = true;
    this.stopSyncingTableInfo();
    this.hud.close();
  }

  syncTableInfo(runInstantly = true) {
    if (runInstantly) this.getTableInfo();
    this.syncTableInfoInterval = setInterval(
      () => this.getTableInfo(),
      TICK_RATE
    );
  }

  stopSyncingTableInfo() {
    clearInterval(this.syncTableInfoInterval);
  }

  getTableInfo() {
    try {
      // Update the document (in case we have joined a new table)
      this.doc = this.iframe.contentWindow?.document;

      return {
        blinds: this.getBlinds(),
        board: this.getBoard(),
        players: this.getPlayers(),
        totalPot: this.getTotalPot(),
        mainPot: this.getMainPot(),
        sidePots: this.getSidePots(),
      };
    } catch (error) {
      if (this.isClosing) return;
      logMessage(`${this.logMessagePrefix}Error getting table info: ${error}`, {
        color: "red",
      });
      console.error(error);
    }
  }

  nextHand() {
    if (!this.firstHandDealt) {
      // Reset activity after the first hand to prevent calculating statistics without the missing data from the first hand (e.g. if we join the table in the middle of a hand, we don't want to calculate statistics for that hand)
      for (const player of Array.from(this.players.values()))
        player.resetActionHistory();

      this.firstHandDealt = true;
    }

    this.board = [];
    this.numHandsDealt++;

    this.totalPot = undefined;
    this.mainPot = undefined;
    this.sidePots = [];

    logMessage(`${this.logMessagePrefix}The next hand is starting...`, {
      color: "magenta",
    });

    this.stopSyncingTableInfo();
    this.syncTableInfo(false);

    // Add a "NEXT HAND" action to the action history of each player
    for (const player of Array.from(this.players.values()))
      player.actionHistory.push({
        action: "NEXT HAND",
        timestamp: formatTimestamp(new Date()),
      });
    this.rfiPosition = undefined;
    this.updatePlayerPositions();
  }

  getBlinds() {
    // To get the header container DOM:
    //  1. Get the id="root" <div> tag
    //  2. Get the first <div> tag within the root with class "mainContent", then get the innerText of that <div>
    //   • The result will be something like "2/4 No Limit Hold'em", where "2" is the small blind and "4" is the big blind
    //  3. Parse the blinds text to a number and store it in a new Table instance
    const tableDescription = this.doc
      ?.querySelector("#root")
      ?.querySelector(".mainContent")?.innerText;
    this.tableDescription = tableDescription;
    if (!tableDescription) return;

    // Parse the blinds text to two numbers separated by "/"
    //  1. Split the blinds text by "/", then make the small blind be the left side of the "/" and the big blind the right side of the "/" (but before the first " "), where after the first " " is the game type (e.g. "No Limit Hold'em")
    if (!tableDescription?.split("/")[0] || !tableDescription?.split("/")[1])
      return;
    const smallBlind = parseCurrency(tableDescription.split("/")[0]);
    const bigBlind = parseCurrency(
      tableDescription.split("/")[1].split(" ")[0]
    );
    const gameType = tableDescription.split("/")[1].split(" ")[1];

    // Update the blinds if they have changed
    if (
      smallBlind !== this.blinds.small ||
      bigBlind !== this.blinds.big ||
      gameType !== this.gameType
    ) {
      const getUpdatedBlindsMessage = () =>
        `${this.currencySymbol}${roundFloat(smallBlind || 0)}/${
          this.currencySymbol
        }${roundFloat(bigBlind || 0)}`;

      logMessage(
        `${this.logMessagePrefix}${
          (smallBlind !== this.blinds.small || bigBlind !== this.blinds.big) &&
          gameType === this.gameType
            ? `Blinds updated: ${getUpdatedBlindsMessage}`
            : gameType !== this.gameType
            ? `Game type updated: ${gameType}`
            : `Blinds and game type updated: ${getUpdatedBlindsMessage} · ${gameType}`
        }`,
        { color: "mediumpurple" }
      );
      this.blinds.small = smallBlind;
      this.blinds.big = bigBlind;
      this.gameType = gameType;
    }
  }

  getBoard() {
    // To get the table DOM:
    //  1. Get the first <img> with src starting with "./static/media/bkg-table-"
    //  2. Get the parent <div> of that <img>
    //  3. Get the first <svg> tag within that <div> and all of its children that has an attribute of "data-qa" with a value that starts with "card" and does not equal "card-placeholder"
    //  4. Get the 4th-level parent <div> of that <svg>, that's the table DOM
    this.tableDOM = Array.from(
      this.doc
        ?.querySelector('img[src^="./static/media/bkg-table-"]')
        ?.parentNode?.querySelectorAll('svg[data-qa^="card"]') || []
    ).filter(
      (node) => node.getAttribute("data-qa") !== "card-placeholder"
    )[0]?.parentNode?.parentNode?.parentNode?.parentNode;

    // To get the board:
    //  1. Get all <svg> tags within the table DOM that has an attribute of "data-qa" with a value that starts with "card"
    //  2. Get the "data-qa" attribute value of each <svg> tag
    //  3. Filter out all empty/placeholder cards (this is when the <svg> tag's "data-qa" attribute value equals "card-1")
    //  4. Remove all duplicate cards (by removing all duplicate "data-qa" attribute values from the <svg> tags)
    const newBoard = Array.from(
      this.tableDOM?.querySelectorAll('svg[data-qa^="card"]') || []
    )
      .map((svg) => svg.getAttribute("data-qa"))
      // Filter out empty/placeholder cards
      .filter((card) => card !== "card-1")
      // Remove duplicate cards
      .filter((card, index, cards) => cards.indexOf(card) === index)
      .map((card) => formatCard(card))
      .filter((card) => card !== null);

    // Update the board if it has changed
    if (JSON.stringify(newBoard) !== JSON.stringify(this.board)) {
      this.board = newBoard;
      if (this.board.length === 0) {
        logMessage(`${this.logMessagePrefix}The board has been cleared.`, {
          color: "mediumpurple",
        });
        this.nextHand();
      } else
        logMessage(
          `${this.logMessagePrefix}The board has been updated. ${this.board
            .map((card) => `[${card}]`)
            .join(" ")}`,
          { color: "mediumpurple" }
        );
    }

    return this.board;
  }

  getPlayers() {
    const previousPlayersSize = this.players.size;

    // To get all players DOM:
    //  1. Get all <div> tags with attribute "data-qa" with a value that starts with "playerContainer-"
    const playersSeatDOMs = Array.from(
      this.doc?.querySelectorAll('div[data-qa^="playerContainer-"]') || []
    );
    this.playersSeatDOMs = playersSeatDOMs;

    // Create a new Player instance for each player
    for (const seatDOM of playersSeatDOMs) {
      const seatNumber = this.getSeatNumber(seatDOM);
      if (!this.players.has(seatNumber) && !this.isSeatVacant(seatDOM)) {
        logMessage(
          `${this.logMessagePrefix}A player has joined seat #${seatNumber}.`,
          { color: "salmon" }
        );
        this.players.set(seatNumber, new Player(seatDOM, seatNumber, this));
      }
    }

    // If a player has left, remove them from the players
    for (const seatNumber of this.players.keys()) {
      if (!this.isSeatVacant(this.players.get(seatNumber).dom)) continue;
      if (
        !playersSeatDOMs.some((div) => this.getSeatNumber(div) === seatNumber)
      ) {
        this.players.delete(seatNumber);
        logMessage(
          `${this.logMessagePrefix}A player has left seat #${seatNumber}.`,
          { color: "salmon" }
        );
      }
    }

    // Mark the user's seat number
    this.myPlayerSeatNumber = Array.from(this.players.values()).find(
      (player) => player.isMyPlayer
    )?.seatNumber;

    // Log the other players if they have changed
    if (previousPlayersSize !== this.players.size) {
      logMessage(
        `${this.logMessagePrefix}Players: ${Array.from(this.players.values())
          .map(
            (player) =>
              `(#${player.seatNumber}${player.isMyPlayer ? " - you" : ""}) ${
                this.currencySymbol
              }${roundFloat(player.balance || 0)}`
          )
          .join(" | ")}`,
        { color: "orangered" }
      );
    }

    return this.updatePlayerPositions();
  }

  getSeatNumber(seatDOM) {
    return parseInt(seatDOM.getAttribute("data-qa").match(/\d+/g)[0]) + 1;
  }

  isSeatVacant(seatDOM) {
    // To check if a seat is vacant:
    //  1. Check if there is a <div> with attribute "data-qa" with a value of "player-empty-seat-panel"
    return (
      seatDOM.querySelector('div[data-qa="player-empty-seat-panel"]') !== null
    );
  }

  getTotalPot() {
    const totalPotText = this.doc.querySelector(
      'span[data-qa="totalPot"]'
    )?.innerText;
    const totalPot = totalPotText ? parseCurrency(totalPotText) : undefined;

    // Update the total pot if it has changed
    if (totalPot !== undefined && this.totalPot !== totalPot) {
      logMessage(
        `${this.logMessagePrefix}Total pot updated: ${
          this.currencySymbol
        }${roundFloat(totalPot || 0)}${
          this.totalPot !== undefined
            ? ` (net: ${this.currencySymbol}${roundFloat(
                totalPot - (this.totalPot || 0)
              )}, previous: ${this.currencySymbol}${roundFloat(
                this.totalPot || 0
              )})`
            : ""
        }`,
        { color: "mediumseagreen" }
      );
      this.totalPot = totalPot;
    }

    return this.totalPot;
  }

  getMainPot() {
    const mainPotText = this.doc.querySelector(
      'span[data-qa="totalPot-0"]'
    )?.innerText;
    const mainPot = mainPotText ? parseCurrency(mainPotText) : undefined;

    // Update the main pot if it has changed
    if (mainPot !== undefined && this.mainPot !== mainPot) {
      logMessage(
        `${this.logMessagePrefix}Main pot updated: ${
          this.currencySymbol
        }${roundFloat(mainPot || 0)}${
          this.mainPot !== undefined
            ? ` (net: ${this.currencySymbol}${roundFloat(
                mainPot - (this.mainPot || 0)
              )}, previous: ${this.currencySymbol}${roundFloat(
                this.mainPot || 0
              )})`
            : ""
        }`,
        { color: "mediumseagreen" }
      );
      this.mainPot = mainPot;
    }

    return this.mainPot;
  }

  getSidePots() {
    const sidePotsDOM = Array.from(
      this.doc.querySelectorAll('span[data-qa^="totalPot-"]') || []
    )
      // Exclude the main pot from the side pots
      .filter((span) => span.getAttribute("data-qa") !== "totalPot-0");
    const sidePots = sidePotsDOM.map((span) => parseCurrency(span.innerText));

    // Update the side pots if they have changed
    if (JSON.stringify(this.sidePots) !== JSON.stringify(sidePots)) {
      if (sidePots.length === 0)
        logMessage(`${this.logMessagePrefix}Side pots have been cleared.`, {
          color: "mediumseagreen",
        });
      else
        logMessage(
          `${this.logMessagePrefix}Side pots updated: ${sidePots
            .map(
              (pot, potIndex) =>
                `(#${potIndex + 1}) ${this.currencySymbol}${roundFloat(
                  pot || 0
                )}${
                  this.sidePots !== undefined
                    ? ` (net: ${this.currencySymbol}${roundFloat(
                        pot - (this.sidePots[potIndex] || 0)
                      )}, previous: ${this.currencySymbol}${roundFloat(
                        this.sidePots[potIndex] || 0
                      )})`
                    : ""
                }`
            )
            .join(" | ")}`,
          { color: "mediumseagreen" }
        );
      this.sidePots = sidePots;
    }

    return this.sidePots;
  }

  // Update all player positions (e.g. "BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "MP", "MP+1", "MP+2", "LJ", "HJ", "CO"):
  updatePlayerPositions() {
    const previousButtonPlayer = Array.from(this.players.values()).find(
      (player) => player.position?.includes("BTN")
    );

    // 1. Get the player with the "BTN" position
    const buttonPlayer = Array.from(this.players.values()).find((curPlayer) => {
      // To get the button indicator DOM:
      //  1. Get the <div> with a style including "z-index: 201" (e.g. <div style="z-index: 201; display: contents;">)
      const buttonIndicatorDOM = Array.from(
        curPlayer.dom.querySelectorAll("div")
      ).find((div) => div.style.zIndex === "201");
      curPlayer.buttonIndicatorDOM = buttonIndicatorDOM;

      // To get the button visibility DOM:
      //  1. Get the first child <div> with their classList containing "Desktop" and a style including "visibility: visible" or "visibility: hidden" (don't check recursively, only check the first level of children)
      const buttonVisibilityDOM = Array.from(buttonIndicatorDOM.children).find(
        (div) =>
          div.classList.contains("Desktop") &&
          (div.style.visibility === "visible" ||
            div.style.visibility === "hidden")
      );
      curPlayer.buttonVisibilityDOM = buttonVisibilityDOM;

      // Check if the current player is the dealer ("BTN")
      // • If the button visibility DOM is visible, that means the current player is the dealer ("BTN")
      if (buttonVisibilityDOM?.style.visibility !== "visible") return false;

      // Check if the current player's position is not "BTN"
      if (!curPlayer.position?.includes("BTN")) {
        // Okay, so the dealer chip has moved to the current player's seat, or we are just joining the table and the dealer chip is already on the current player's seat, so we have to update the player positions...
        // Let's mark this current player as the dealer ("BTN") and clear all other players' positions...

        // 1. Clear all players' positions
        for (const player of Array.from(this.players.values()).filter(
          (player) => player.seatNumber !== curPlayer.seatNumber
        ))
          player.position = null;
        logMessage(
          `${this.logMessagePrefix}New dealer detected. Clearing all current player position data...`,
          { color: "mistyrose" }
        );

        // 2. Update the current player's position to "BTN" (the dealer)
        curPlayer.position = `BTN${
          curPlayer.isSittingOut() ? " (SITTING OUT)" : ""
        }`;
        logMessage(
          `${curPlayer.logMessagePrefix}Position updated: ${curPlayer.position}`,
          { color: curPlayer.isMyPlayer ? "goldenrod" : "plum" }
        );

        // Add a "POSITION UPDATED" action to the action history of the current player (place it after the last occurance of the "NEXT HAND" action)
        curPlayer.actionHistory.splice(
          curPlayer.actionHistory.findLastIndex(
            (action) => action.action === "NEXT HAND"
          ) + 1,
          0,
          {
            action: `POSITION UPDATED · ${curPlayer.position}`,
            timestamp: formatTimestamp(new Date()),
          }
        );
      }

      // 3. Return the current player with the "BTN" position (the dealer)
      return true;
    });

    // Check if we have found the player with the "BTN" position (the dealer)
    if (
      (!previousButtonPlayer && buttonPlayer) ||
      (previousButtonPlayer &&
        buttonPlayer &&
        previousButtonPlayer.seatNumber !== buttonPlayer.seatNumber)
    ) {
      {
        // Now that we have the player with the "BTN" (dealer) position, we have to calculate the rest of the player's positions relative to the dealer...
        // 1. Get all players that are delt cards (meaning they are not sitting out)
        const activePlayers = Array.from(this.players.values())
          .filter((player) => buttonPlayer.seatNumber !== player.seatNumber)
          .filter((player) => {
            if (player.isSittingOut()) {
              // TODO: Check if the player IS IN THE SMALL BLIND SPOT, BLOCKING THE SMALL BLIND FROM POSTING THE BLIND!
              // • In this very specific circumstance, only if the player is in the small blind spot and JUST sat out from doing ONE hand as the big blind, then we can mark the player as "SB (SITTING OUT), otherwise, it messes up the other players' positions (BB would be marked as SB, UTG would be marked as BB, and UTG+1/CO/HJ/LJ would be marked as UTG. These are the only possible messed up positions, but it's still a problem, so we have to fix it)
              // TODO: the reason why this is very difficult is because we need to see if the user JUST did the BB then sat out.. We can do this with this.actionHistory!
              // if (
              //   buttonPlayer.seatNumber + 1 === player.seatNumber ||
              //   (buttonPlayer.seatNumber ===
              //     Math.max(
              //       ...Array.from(this.players.values()).map(
              //         (player) => player.seatNumber
              //       )
              //     ) &&
              //     player.seatNumber === 1)
              // ) {
              //   // Mark the player as sitting out in the small blind spot
              //   player.position = `SB (SITTING OUT)`;
              //   logMessage(
              //     `${player.logMessagePrefix}Player is now sitting out in the small blind spot (preventing the small blind from posting the blind).`,
              //     {
              //       color: player.isMyPlayer ? "goldenrod" : "lightgray",
              //     }
              //   );

              //   return true;
              // }

              // Mark the player as sitting out
              player.position = null;
              logMessage(
                `${player.logMessagePrefix}Player is now sitting out.`,
                {
                  color: player.isMyPlayer ? "goldenrod" : "lightgray",
                }
              );

              return false;
            }

            return true;
          })
          .sort((a, b) => a.seatNumber - b.seatNumber);

        // 2. Calculate the player's position relative to the button
        // To calculate the player's position:
        //  1. Find the player with the "BTN" position, and get the player's position relative to the player with the "BTN" position
        //   Note: Make sure to skip any players with player.position === null (this means they are sitting out, so they should not be included in the calculation)
        //  2. The positions are as follows: "UTG", "UTG+1", "UTG+2", "UTG+x", "MP", "MP+1", "MP+2", "MP+x", "LJ", "HJ", "CO", "BTN", "SB", "BB", etc. where "SB" is the player to the left of the "BTN" player, "BB" is the player to the left of the "SB" player, "UTG" is the player to the left of the "BB" player, and so on
        //   Note: Make sure "UTG" is always after "SB", "BTN" is always after "CO", "HJ" is always before "CO", and "LJ" is always before "HJ", and "MP+x" (only include "+x", where x is represents the additional "MP" after "MP") is always before "LJ", and "UTG" (or "UTG+x") is always before "MP"
        //   Another note: On a table with 9 people, the order should always be "BTN", "SB", "BB", "UTG", "UTG+1", "MP", "LJ", "HJ", "CO"
        //   Adding onto the note above: On a table with 6 people, the order should always be "BTN", "SB", "BB", "UTG", "HJ", "CO"
        //   • On extreme cases, which will almost never happen, if there is a table with 13 people for example, the order should be "BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "UTG+3", "MP", "MP+1", "MP+2", "LJ", "HJ", "CO" (you can tell that "UTG+x" gets priority over "MP+x", so whenever theres an odd number of player NOT "UTG"/"UTG+x" or "MP"/"MP+x", the role assigning of "UTG"/"UTG+x" players will be prioritized over the "MP"/"MP+x" players, meaning the "+x" number for "UTG+x" will always be greater than the "+x" number for "MP+x")

        // Pivot the SB to the first position in a new array pivotedActivePlayersInOrder, then using the player seatNumbers, we can add the remaining players in order counting up from the dealer, then when we reach the highest seatNumber, we can add the remaining players in order counting from 1 to the dealer's seatNumber
        const pivotedActivePlayersInOrder = [
          // Add the remaining players in order counting up from the dealer until we reach the highest seatNumber
          ...activePlayers
            .filter((player) => player.seatNumber > buttonPlayer.seatNumber)
            .sort((a, b) => a.seatNumber - b.seatNumber),
          // Add the remaining players in order counting from 1 to the dealer's seatNumber
          ...activePlayers
            .filter((player) => player.seatNumber < buttonPlayer.seatNumber)
            .sort((a, b) => a.seatNumber - b.seatNumber),
        ];

        let unassignedPlayers = [];
        if (CALCULATE_BEST_ACTIONS) {
          // TODO: assign CO, HJ, LJ BEFORE SB, BB, UTG... (this is how the positions are formatted on Jonathan Little's Poker GTO charts)
          // > update this.position calculations (in PokerTable.updatePlayerPositions()) to always start with CO going backwards rather than UTG going forwards

          // Assign the positions.
          // First, assign SB, BB
          for (let i = 0; i <= 1; i++) {
            const player = pivotedActivePlayersInOrder[i];

            // Check if we have reached the end of the player list or if the player already has a position
            if (!player || player.position !== null) break;

            switch (i) {
              case 0:
                player.position = `SB${
                  player.isSittingOut() ? " (SITTING OUT)" : ""
                }`;
                break;
              case 1:
                player.position = "BB";
                break;
              default:
                break;
            }
          }

          // Get the remaining players with an unassigned position
          unassignedPlayers = pivotedActivePlayersInOrder.filter(
            (player) => player.position === null
          );

          // Then, go to the end of the unassigned player list: for each player, assign backwards CO, HJ, LJ.
          for (let i = unassignedPlayers.length - 1; i >= 0; i--) {
            const player = unassignedPlayers[i];

            // Check if we have reached past the beginning of the player list (which will probably never happen) or if the player already has a position
            if (!player || player.position !== null) break;

            switch (i) {
              case unassignedPlayers.length - 1:
                player.position = "CO";
                break;
              case unassignedPlayers.length - 2:
                player.position = "HJ";
                break;
              case unassignedPlayers.length - 3:
                player.position = "LJ";
                break;
              default:
                break;
            }
          }

          // Update the unassignedPlayers array
          unassignedPlayers = unassignedPlayers.filter(
            (player) => player.position === null
          );

          // Now, let's assign the UTG position.
          const utgPlayer = unassignedPlayers[0];
          if (utgPlayer) utgPlayer.position = "UTG";
        } else {
          // Assign the positions.
          // First, assign SB, BB, UTG
          for (let i = 0; i <= 2; i++) {
            const player = pivotedActivePlayersInOrder[i];

            // Check if we have reached the end of the player list or if the player already has a position
            if (!player || player.position !== null) break;

            switch (i) {
              case 0:
                player.position = `SB${
                  player.isSittingOut() ? " (SITTING OUT)" : ""
                }`;
                break;
              case 1:
                player.position = "BB";
                break;
              case 2:
                player.position = "UTG";
                break;
              default:
                break;
            }
          }

          // Get the remaining players with an unassigned position
          unassignedPlayers = pivotedActivePlayersInOrder.filter(
            (player) => player.position === null
          );

          // Then, go to the end of the unassigned player list: for each player, assign backwards CO, HJ, LJ.
          for (let i = unassignedPlayers.length - 1; i >= 0; i--) {
            const player = unassignedPlayers[i];

            // Check if we have reached past the beginning of the player list (which will probably never happen) or if the player already has a position
            if (!player || player.position !== null) break;

            switch (i) {
              case unassignedPlayers.length - 1:
                player.position = "CO";
                break;
              case unassignedPlayers.length - 2:
                player.position = "HJ";
                break;
              case unassignedPlayers.length - 3:
                player.position = "LJ";
                break;
              default:
                break;
            }
          }
        }

        // Update the unassignedPlayers array
        unassignedPlayers = unassignedPlayers.filter(
          (player) => player.position === null
        );

        // Now, let's assign the positions in the middle of the [BTN, SB, BB, UTG, ..., LJ, HJ, CO] that are still unassigned
        const firstHalfOfUnassignedPlayers = unassignedPlayers.slice(
            0,
            Math.floor(unassignedPlayers.length / 2)
          ),
          secondHalfOfUnassignedPlayers = unassignedPlayers.slice(
            Math.floor(unassignedPlayers.length / 2)
          );

        // Assign the first half of the unassigned players (UTG+x)
        for (let i = 0; i < firstHalfOfUnassignedPlayers.length; i++) {
          const player = firstHalfOfUnassignedPlayers[i];

          // Check if the player already has a position
          if (player.position !== null) continue;

          player.position = `UTG+${i + 1}`;
        }

        // Assign the second half of the unassigned players (MP, MP+x)
        for (let i = 0; i < secondHalfOfUnassignedPlayers.length; i++) {
          const player = secondHalfOfUnassignedPlayers[i];

          // Check if the player already has a position
          if (player.position !== null) continue;

          if (i === 0) player.position = "MP";
          else player.position = `MP+${i + 1}`;
        }

        // Log the updated positions
        for (const player of pivotedActivePlayersInOrder) {
          // Ignore non-updated players
          if (player.position === null || player.position?.includes("BTN"))
            continue;

          logMessage(
            `${player.logMessagePrefix}Position updated: ${player.position}`,
            {
              color: player.isMyPlayer ? "goldenrod" : "plum",
            }
          );

          // Add a "POSITION UPDATED" action to the action history of the current player (place it after the last occurance of the "NEXT HAND" action)
          player.actionHistory.splice(
            player.actionHistory.findLastIndex(
              (action) => action.action === "NEXT HAND"
            ) + 1,
            0,
            {
              action: `POSITION UPDATED · ${player.position}`,
              timestamp: formatTimestamp(new Date()),
            }
          );
        }
      }
    }

    return this.players;
  }
}

const formatHandForAPI = (hand) => {
  // Replace "10" with "T" for each card
  const formattedCards = hand.map((card) => card.replace("10", "T"));

  // Validate each card's length
  if (formattedCards.some((card) => card.length !== 2)) return null;

  // Extract ranks and suits
  const [rank1, suit1] = [
    formattedCards[0].slice(0, -1),
    formattedCards[0].slice(-1),
  ];
  const [rank2, suit2] = [
    formattedCards[1].slice(0, -1),
    formattedCards[1].slice(-1),
  ];

  // Sort ranks in descending order
  const sortOrder = "AKQJT98765432";
  const sortedRanks = [rank1, rank2].sort((a, b) => {
    return sortOrder.indexOf(a) - sortOrder.indexOf(b);
  });

  // Determine the suffix ('s', 'o', or '')
  const suffix = rank1 === rank2 ? "" : suit1 === suit2 ? "s" : "o";

  // Join the sorted cards to a single string with the suffix
  return `${sortedRanks[0]}${sortedRanks[1]}${suffix}`;
};

// To format a card (from the "data-qa" attribute value):
//  1. Get all numbers from the string
//  2. Convert the numbers to the formatted card (e.g. "card9" is the 10 of clubs, or "10c" as we call it)
//   Note: clubs are numbers in range 0-12, diamonds are 13-25, hearts are 26-38, and spades are 39-51
//    • Full list of cards:
//     ac = 0, 2c = 1, 3c = 2, 4c = 3, 5c = 4, 6c = 5, 7c = 6, 8c = 7, 9c = 8, 10c = 9, jc = 10, qc = 11, kc = 12
//     ad = 13, 2d = 14, 3d = 15, 4d = 16, 5d = 17, 6d = 18, 7d = 19, 8d = 20, 9d = 21, 10d = 22, jd = 23, qd = 24, kd = 25
//     ah = 26, 2h = 27, 3h = 28, 4h = 29, 5h = 30, 6h = 31, 7h = 32, 8h = 33, 9h = 34, 10h = 35, jh = 36, qh = 37, kh = 38
//     as = 39, 2s = 40, 3s = 41, 4s = 42, 5s = 43, 6s = 44, 7s = 45, 8s = 46, 9s = 47, 10s = 48, js = 49, qs = 50, ks = 51
const formatCard = (unformattedCard) => {
  const number = parseInt(unformattedCard.match(/\d+/g)[0]);

  // Make sure the number is valid
  if (isNaN(number) || number > 51) return null;

  const suit = Math.floor(number / 13);
  return `${
    ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][
      number % 13
    ]
  }${"cdhs"[suit]}`;
};

// Initialize a Map to store all poker tables
const pokerTables = new Map();

// Check for newly opened/closed poker table "slots"
function syncPokerTableSlots(iframes = getTableSlotIFrames()) {
  assignNewPokerTableSlots(iframes);
  removeClosedPokerTableSlots(iframes);
}

// Assign newly opened poker table slots
function assignNewPokerTableSlots(iframes = getTableSlotIFrames()) {
  for (const iframe of iframes) {
    const slotNumber = getMultitableSlot(iframe);
    if (slotNumber !== 0 && !pokerTables.has(slotNumber)) {
      logMessage(`(Table #${slotNumber}): Table opened.`, {
        color: "limegreen",
      });
      pokerTables.set(slotNumber, new PokerTable(iframe, slotNumber));
    }
  }
}

// Remove closed poker table slots
function removeClosedPokerTableSlots(iframes = getTableSlotIFrames()) {
  for (const slotNumber of pokerTables.keys()) {
    if (!iframes.some((iframe) => getMultitableSlot(iframe) === slotNumber)) {
      pokerTables.get(slotNumber).close();
      pokerTables.delete(slotNumber);
      logMessage(`(Table #${slotNumber}): Table closed.`, {
        color: "red",
      });
    }
  }
}

// Get all "Table slot" iframes and convert the resultant NodeList to Array (for more utility)
const getTableSlotIFrames = () =>
  Array.from(document.querySelectorAll('iframe[title="Table slot"]'));

const getMultitableSlot = (iframe) =>
  parseInt(iframe.getAttribute("data-multitableslot")) + 1;

// Main function (self-invoking)
let syncPokerTableSlotsInterval;
const main = (function main() {
  exit(true);
  syncPokerTableSlots();
  syncPokerTableSlotsInterval = setInterval(syncPokerTableSlots, TICK_RATE);
  return main;
})();

// Exit the script
function exit(silent = false) {
  clearAllIntervals();

  // Stop syncing the poker table slots
  clearInterval(syncPokerTableSlotsInterval);

  // Close all poker tables and stop syncing player info
  for (const table of pokerTables.values()) {
    table.hud.close();
    table.close();
    for (const player of table.players.values()) player.stopSyncingPlayerInfo();
  }

  pokerTables.clear();
  clearAllIntervals();

  if (!silent)
    logMessage("Now exiting PokerEye+ (Plus) for Ignition Casino...", {
      color: "crimson",
    });
}

// utils.js
// Utility function to log watermarked messages to the console
function logMessage(
  message,
  {
    color = "black",
    background = "black",
    fontSize = "1.2em",
    fontWeight = "normal",
    fontStyle = "normal",
  }
) {
  console.log(
    "%c%s",
    `color: ${color}; background: ${background}; font-size: ${fontSize}; font-weight: ${fontWeight}; font-style: ${fontStyle};`,
    `[PokerEye+]: ${message}`
  );
}

// Utility function to clear all timeouts/intervals created by the script
function clearAllIntervals() {
  // Get a reference to the last interval + 1
  const interval_id = window.setInterval(function () {},
  Number.MAX_SAFE_INTEGER);

  // Clear any timeout/interval up to that id
  for (let i = 1; i < interval_id; i++) {
    window.clearInterval(i);
  }
}

function roundFloat(
  number,
  decimalPlaces = 2,
  forceDecimalPlaces = true,
  asCurrency = false
) {
  return forceDecimalPlaces
    ? parseFloat(number.toFixed(decimalPlaces)).toLocaleString("en-US", {
        style: asCurrency ? "currency" : undefined,
        currency: asCurrency ? "USD" : undefined,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    : parseFloat(number.toFixed(decimalPlaces));
}

function parseCurrency(currency) {
  if (currency === undefined || currency === null) return null;
  return parseFloat(currency.toString().replace(/[$,]/g, ""));
}

function formatCurrencyLikeIgnition(
  number,
  allowAdditionalZeroPastDecimal = true
) {
  const formattedNumber = parseCurrency(number)
    .toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replace(/\$/g, "")
    .replace(".00", "");

  return allowAdditionalZeroPastDecimal
    ? formattedNumber
    : formattedNumber.replace(/\.0+$/, "").replace(/(\.\d+?)0+$/, "$1");
}

function formatTimestamp(date) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const mmm = String(date.getMilliseconds()).padStart(3, "0");

  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}.${mmm}`;
}

// Converts a formatted timestamp (e.g. "2021-01-01 00:00:00.000") to a relative timestamp (e.g. "1 second ago", "2 minutes ago", "3 hours ago")
function convertFormattedTimestampToAgo(formattedTimestamp) {
  const timestamp = new Date(formattedTimestamp).getTime();
  const now = new Date().getTime();
  const difference = now - timestamp;

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds <= 0) return "just now";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  else if (minutes < 60)
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  else if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  else return `${Math.floor(hours / 24)} days ago`;
}

function generateRandom16BitNumber() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function generateUUID() {
  return (
    generateRandom16BitNumber() +
    generateRandom16BitNumber() +
    "-" +
    generateRandom16BitNumber() +
    "-" +
    generateRandom16BitNumber() +
    "-" +
    generateRandom16BitNumber() +
    "-" +
    generateRandom16BitNumber() +
    generateRandom16BitNumber() +
    generateRandom16BitNumber()
  );
}

// attribution.js
const SOFTWARE_NAME = "PokerEye+ (Plus) for Ignition Casino";
const SOFTWARE_VERSION = "1.0.0";
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
    "%c%s%c%s",
    "color: magenta; background: black;",
    `${ASCII_LOGO_BORDER_Y}${ASCII_LOGO}\n${ASCII_LOGO_BORDER_Y}\n\n`,
    "color: magenta; font-size: 1.5em; background: black; font-weight: bold;",
    `${SOFTWARE_NAME} v${SOFTWARE_VERSION}\n`
  );
}
