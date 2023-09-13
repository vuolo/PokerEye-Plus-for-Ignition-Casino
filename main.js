const TICK_RATE = 100; // ms
const LOG_PLAYER_SECONDS_LEFT_TO_MAKE_A_MOVE = false;
// const TAILWIND_CSS_CDN_URL = "https://cdn.tailwindcss.com";

class HUD {
  constructor(pokerTable) {
    this.pokerTable = pokerTable;

    this.init();
  }

  init() {
    this.isCreated = undefined;
    this.isVisible = false;

    logMessage(`${this.pokerTable.logMessagePrefix}Initializing HUD...`, {
      color: "cyan",
    });

    // this.importTailwindCSS();
    this.syncDOM();
  }

  // deprecated (since it messes up the table image's styling...)
  // importTailwindCSS() {
  //   // Check if Tailwind CSS is already imported
  //   for (let script of this.doc.scripts)
  //     if (script.src === TAILWIND_CSS_CDN_URL) return;

  //   // Import Tailwind CSS
  //   const script = this.doc.createElement("script");
  //   script.src = TAILWIND_CSS_CDN_URL;
  //   this.doc.head.appendChild(script);
  // }

  close() {
    this.stopSyncingDOM();
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
      this.tableContainer = Array.from(this.tableWrapper.children).slice(-2)[0];
      this.footerContainer = Array.from(this.tableWrapper.children).pop();

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

      if (!this.isCreated) this.createHud();
      else {
        // Refresh the toggleVisibilitySwitch if it disappeared
        if (
          !this.footerContainer.querySelector(
            "#PokerEyePlus-toggleVisibilitySwitch"
          )
        ) {
          removeHUD({ toggleVisibilitySwitch: true });
          this.createToggleVisibilitySwitch();
        }
      }
    } catch (error) {
      // console.error(error);
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

    this.createToggleVisibilitySwitch();

    logMessage(
      `${this.pokerTable.logMessagePrefix}HUD created. Click the switch to toggle visibility.`,
      { color: "cyan" }
    );
    this.isCreated = true;
  }

  removeHUD(options = { toggleVisibilitySwitch: true }) {
    if (options.toggleVisibilitySwitch)
      this.doc
        ?.querySelectorAll("#PokerEyePlus-toggleVisibilitySwitch")
        ?.forEach((node) => node.remove());
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

  // Place the switch in the bottom right corner of the screen
  createToggleVisibilitySwitch() {
    const container = this.doc.createElement("div");
    container.id = "PokerEyePlus-toggleVisibilitySwitch";
    container.className = this.ignitionSwitchContainerClassName;
    container.style.position = "absolute";
    container.style.right = "0";
    container.style.bottom = "0";
    container.style.margin = "0.25rem";
    container.style.padding = "0.5rem";
    container.style.cursor = "pointer";
    container.style.color = "#E3E3E3";
    container.style.fontSize = "12px";
    container.innerHTML = `
      <div class="${this.ignitionSwitchBarClassName}">
        <div class="${this.ignitionSwitchButtonClassName}"></div>
      </div>
      <div style="margin-top: 1px;">PokerEye+</div>
    `;
    this.toggleVisibilitySwitch = container;

    const bar = container.querySelector(`.${this.ignitionSwitchBarClassName}`);
    const button = container.querySelector(
      `.${this.ignitionSwitchButtonClassName}`
    );
    container.addEventListener("click", () => {
      this.toggleVisibility();
      if (this.isVisible) {
        bar.classList.add("switchedOn");
        button.classList.add("switchedOn");
      } else {
        bar.classList.remove("switchedOn");
        button.classList.remove("switchedOn");
      }
    });

    this.footerContainer.appendChild(container);
  }
}

class Player {
  constructor(dom, seatNumber, parentTable) {
    this.dom = dom;
    this.seatNumber = seatNumber;
    this.parentTable = parentTable;

    this.init();
  }

  init() {
    this.isMyPlayer = this.dom.classList.contains("myPlayer");

    this.balance = undefined;
    this.holeCards = [];
    this.actionHistory = [];
    this.isTurnToAct = false;
    this.position = null;

    this.logMessagePrefix = `(Table #${this.parentTable.slotNumber}, Seat #${
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
        holeCards: this.getHoleCards(),
        actionHistory: this.getCurrentAction(),
      };
    } catch (error) {
      logMessage(
        `${this.logMessagePrefix}Error getting player info: ${error}`,
        { color: "red" }
      );
      console.error(error);
    }
  }

  resetActionHistory() {
    this.actionHistory = [];
    this.isTurnToAct = false;

    this.stopSyncingPlayerInfo();
    this.syncPlayerInfo(false);
  }

  getBalance() {
    const previousBalance = this.balance;

    // To get the player balance:
    //  1. Get the innerText of the <span> tag with attribute "data-qa" with value "playerBalance"
    //  2. Parse the balance text to a number and store it in a new Player instance
    //   Note: These values are formatted in the "x,xxx.xx" format (e.g."2,224.37"), but whenever the value has no decimal places, the format is "x,xxx" (e.g. "1,963")
    const balanceText = this.dom.querySelector(
      'span[data-qa="playerBalance"]'
    )?.innerText;
    const balance = parseCurrency(balanceText);
    this.balance = balance;

    // Log the balance if it has changed
    if (this.balance !== undefined && previousBalance !== this.balance)
      logMessage(
        `${this.logMessagePrefix}Balance updated: $${roundFloat(
          this.balance || 0
        )}${
          previousBalance !== undefined
            ? ` (net: $${roundFloat(
                this.balance - (previousBalance || 0)
              )}, previous: $${roundFloat(previousBalance || 0)})`
            : ""
        }`,
        { color: this.isMyPlayer ? "goldenrod" : "lightgray" }
      );

    return this.balance;
  }

  getHoleCards() {
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

    // To get hole cards:
    //  1. Get the "data-qa" attribute value of each <svg> tag
    //  2. Filter out all empty/placeholder cards (this is when the <svg> tag's "data-qa" attribute value equals "card-1")
    //  3. Remove all duplicate cards (by removing all duplicate "data-qa" attribute values from the <svg> tags)
    const newHoleCards = holeCardsDOM
      .map((svg) => svg.getAttribute("data-qa"))
      .filter((card) => card !== "card-1")
      .filter((card, index, cards) => cards.indexOf(card) === index)
      .map((card) => formatCard(card))
      .filter((card) => card !== null);

    // Update the hole cards if they have changed
    if (JSON.stringify(newHoleCards) !== JSON.stringify(this.holeCards)) {
      this.holeCards = newHoleCards;
      if (this.holeCards.length === 0)
        logMessage(`${this.logMessagePrefix}Hole cards have been cleared.`, {
          color: this.isMyPlayer ? "goldenrod" : "lightblue",
        });
      else
        logMessage(
          `${this.logMessagePrefix}Hole cards: ${this.holeCards
            .map((card) => `[${card}]`)
            .join(" ")}`,
          { color: this.isMyPlayer ? "goldenrod" : "lightblue" }
        );
    }

    return this.holeCards;
  }

  // Get a list of all player actions (e.g. "FOLD", "CHECK", "CALL", "BET", "RAISE", "ALL-IN", "ALL-IN · x%", "SITTING OUT", "POST SB", "POST BB", "x seconds left to make a move...", "NEW PLAYER", "DONT SHOW") along with the action's timestamp (e.g. "2021-01-01 00:00:00.000")
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

      // Check if the player's current action is different from the previous action
      if (
        !currentAction ||
        (this.actionHistory.length > 0 &&
          this.actionHistory[this.actionHistory.length - 1].action ===
            currentAction)
      )
        return;

      // Create an action object
      const action = {
        action: currentAction,
        timestamp: formatTimestamp(new Date()),
      };

      // Add the action object to the actionHistory array
      this.actionHistory.push(action);
      this.isTurnToAct = action.action.includes(
        "seconds left to make a move..."
      )
        ? true
        : false;
      if (
        LOG_PLAYER_SECONDS_LEFT_TO_MAKE_A_MOVE ||
        !action.action.includes("seconds left to make a move...")
      ) {
        logMessage(
          `${this.logMessagePrefix}> ${action.action} (at ${action.timestamp})`,
          {
            color: this.isMyPlayer
              ? "goldenrod"
              : action.action.includes("seconds left to make a move...")
              ? "lightgray"
              : "lightblue",
          }
        );
      }
    }

    return this.actionHistory;
  }

  formatAction(action) {
    return (
      // Check if the action is just a number (e.g. "7" for "7 seconds left to make a move")
      !isNaN(action) ? `${action} seconds left to make a move...` : action
    );
  }
}

class PokerTable {
  constructor(iframe, slotNumber) {
    this.iframe = iframe;
    this.slotNumber = slotNumber;

    this.init();
  }

  init() {
    this.doc = this.iframe.contentWindow?.document;
    this.firstHandDone = false;

    this.board = [];
    this.players = new Map();

    this.totalPot = undefined;
    this.mainPot = undefined;
    this.sidePots = [];

    this.logMessagePrefix = `(Table #${this.slotNumber}): `;

    this.syncTableInfo();
    this.hud = new HUD(this);
  }

  close() {
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
        board: this.getBoard(),
        players: this.getPlayers(),
        totalPot: this.getTotalPot(),
        mainPot: this.getMainPot(),
        sidePots: this.getSidePots(),
      };
    } catch (error) {
      logMessage(`${this.logMessagePrefix}Error getting table info: ${error}`, {
        color: "red",
      });
      console.error(error);
    }
  }

  nextHand() {
    if (!this.firstHandDone) {
      // Reset activity after the first hand to prevent calculating statistics without the missing data from the first hand (e.g. if we join the table in the middle of a hand, we don't want to calculate statistics for that hand)
      for (const player of Array.from(this.players.values()))
        player.resetActionHistory();

      this.firstHandDone = true;
    }

    this.board = [];

    this.totalPot = undefined;
    this.mainPot = undefined;
    this.sidePots = [];

    logMessage(`${this.logMessagePrefix}The next hand is starting...`, {
      color: "magenta",
    });

    this.stopSyncingTableInfo();
    this.syncTableInfo(false);
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

    // Log the other players if they have changed
    if (previousPlayersSize !== this.players.size) {
      logMessage(
        `${this.logMessagePrefix}Players: ${Array.from(this.players.values())
          .map(
            (player) =>
              `(#${player.seatNumber}) $${roundFloat(player.balance || 0)}`
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
        `${this.logMessagePrefix}Total pot updated: $${roundFloat(
          totalPot || 0
        )}${
          this.totalPot !== undefined
            ? ` (net: $${roundFloat(
                totalPot - (this.totalPot || 0)
              )}, previous: $${roundFloat(this.totalPot || 0)})`
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
        `${this.logMessagePrefix}Main pot updated: $${roundFloat(
          mainPot || 0
        )}${
          this.mainPot !== undefined
            ? ` (net: $${roundFloat(
                mainPot - (this.mainPot || 0)
              )}, previous: $${roundFloat(this.mainPot || 0)})`
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
      logMessage(
        `${this.logMessagePrefix}Side pots updated: ${sidePots
          .map(
            (pot, potIndex) =>
              `(#${potIndex + 1}) $${roundFloat(pot || 0)}${
                this.sidePots !== undefined
                  ? ` (net: $${roundFloat(
                      pot - (this.sidePots[potIndex] || 0)
                    )}, previous: $${roundFloat(this.sidePots[potIndex] || 0)})`
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
      (player) => player.position === "BTN"
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
      if (curPlayer.position !== "BTN") {
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
        curPlayer.position = "BTN";
        logMessage(
          `${curPlayer.logMessagePrefix}Position updated: ${curPlayer.position}`,
          { color: curPlayer.isMyPlayer ? "goldenrod" : "plum" }
        );
      }

      // 3. Return the current player with the "BTN" position (the dealer)
      return true;
    });

    // Check if we have found the player with the "BTN" position (the dealer)
    if (
      (!previousButtonPlayer && buttonPlayer) ||
      (previousButtonPlayer &&
        previousButtonPlayer.seatNumber !== buttonPlayer.seatNumber)
    ) {
      {
        // Now that we have the player with the "BTN" (dealer) position, we have to calculate the rest of the player's positions relative to the dealer...
        // 1. Get all players that are delt cards (meaning they are not sitting out)
        const activePlayers = Array.from(this.players.values())
          .filter((player) => buttonPlayer.seatNumber !== player.seatNumber)
          .filter((player) => {
            if (
              player.actionHistory[player.actionHistory.length - 1].action ===
                "SITTING OUT" ||
              player.actionHistory[player.actionHistory.length - 1].action ===
                "NEW PLAYER"
            ) {
              // Check if the player was already marked as sat out
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

        // Assign the positions.
        // First, assign SB, BB, UTG
        for (let i = 0; i <= 2; i++) {
          const player = pivotedActivePlayersInOrder[i];

          // Check if we have reached the end of the player list or if the player already has a position
          if (!player || player.position !== null) break;

          switch (i) {
            case 0:
              player.position = "SB";
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
        let unassignedPlayers = pivotedActivePlayersInOrder.filter(
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
          if (player.position === null || player.position === "BTN") continue;
          logMessage(
            `${player.logMessagePrefix}Position updated: ${player.position}`,
            {
              color: player.isMyPlayer ? "goldenrod" : "plum",
            }
          );
        }
      }
    }

    return this.players;
  }
}

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
  // Stop syncing the poker table slots
  clearInterval(syncPokerTableSlotsInterval);

  // Close all poker tables and stop syncing player info
  for (const table of pokerTables.values()) {
    table.close();
    for (const player of table.players.values()) player.stopSyncingPlayerInfo();
  }

  pokerTables.clear();

  // Force clear all timeouts/intervals created by the script
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

function roundFloat(number, decimalPlaces = 2, forceDecimalPlaces = true) {
  return forceDecimalPlaces
    ? parseFloat(number.toFixed(decimalPlaces)).toLocaleString("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    : parseFloat(number.toFixed(decimalPlaces));
}

function parseCurrency(currency) {
  if (currency === undefined || currency === null) return null;
  return parseFloat(currency.replace(/[$,]/g, ""));
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
