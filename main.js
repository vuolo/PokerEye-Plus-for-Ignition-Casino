const TICK_RATE = 100; // ms

class Player {
  constructor(dom, seatNumber, tableSlotNumber) {
    this.dom = dom;
    this.seatNumber = seatNumber;
    this.tableSlotNumber = tableSlotNumber;
    this.init();
  }

  init() {
    this.isMyPlayer = this.dom.classList.contains("myPlayer");

    this.balance;
    this.holeCards = [];
    this.actionHistory = [];

    this.syncPlayerInfo();
  }

  // TODO: Get the player's position (e.g. "UTG", "UTG+1", "UTG+2", "MP", "MP+1", "MP+2", "CO", "BTN", "SB", "BB"):
  // --------------------------------------------------

  // TODO: get if it's the player's turn to act:
  //   <div class="fghgvzm" style="top: 3px; height: 130px; width: 130px;">
  //    <div class="f1jf43s6" style="animation: 1820ms linear 0ms infinite normal none running f493ozf;"></div>
  //    <div class="f1jf43s6" style="animation: 1820ms linear -455ms infinite normal none running f493ozf;"></div>
  //    <div class="f1jf43s6" style="animation: 1820ms linear -910ms infinite normal none running f493ozf;"></div>
  //    <div class="f1jf43s6" style="animation: 1820ms linear -1365ms infinite normal none running f493ozf;"></div>
  // </div>
  // --------------------------------------------------

  // TODO: get whether or not the player was dealt in:
  // --------------------------------------------------

  getBalance() {
    const previousBalance = this.balance;

    // To get the player balance:
    // 1. Get the innerText of the <span> tag with attribute "data-qa" with value "playerBalance"
    // 2. Parse the balance text to a number and store it in a new Player instance
    // Note: These values are formatted in the "x,xxx.xx" format (e.g."2,224.37"), but whenever the value has no decimal places, the format is "x,xxx" (e.g. "1,963")
    const balanceText = this.dom.querySelector(
      'span[data-qa="playerBalance"]'
    )?.innerText;
    const balance = parseFloat(balanceText.replace(/[$,]/g, ""));
    this.balance = balance;

    // Log the balance if it has changed
    if (previousBalance !== this.balance)
      logMessage(
        `(Table #${this.tableSlotNumber}, Seat #${this.seatNumber}${
          this.isMyPlayer ? " - you" : ""
        }): Balance updated: $${roundFloat(this.balance)}${
          previousBalance !== undefined
            ? ` (net: $${roundFloat(
                this.balance - previousBalance
              )}, previous: $${roundFloat(previousBalance)})`
            : ""
        }`,
        { color: this.isMyPlayer ? "goldenrod" : "lightgray" }
      );

    return this.balance;
  }

  getHoleCards() {
    // To get hole cards DOM:
    // 1. Get all <div> tags with attribute "data-qa" with value of "holeCards"
    // 2. Now, for each of the <div> tags we got in step 1, get all <svg> tags that has an attribute of "data-qa" with a value that starts with "card"
    const holeCardsDOM = Array.from(
      Array.from(
        this.dom.querySelectorAll('div[data-qa="holeCards"]') || []
      ).map((div) => div.querySelectorAll('svg[data-qa^="card"]')) || []
    )
      .map((innerNodeList) => Array.from(innerNodeList))
      .flat();
    this.holeCardsDOM = holeCardsDOM;

    // To get hole cards:
    // 1. Get the "data-qa" attribute value of each <svg> tag
    // 2. Filter out all empty/placeholder cards (this is when the <svg> tag's "data-qa" attribute value equals "card-1")
    // 3. Remove all duplicate cards (by removing all duplicate "data-qa" attribute values from the <svg> tags)
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
        logMessage(
          `(Table #${this.tableSlotNumber}, Seat #${this.seatNumber}${
            this.isMyPlayer ? " - you" : ""
          }): The player's hole cards have been cleared.`,
          {
            color: this.isMyPlayer ? "goldenrod" : "lightblue",
          }
        );
      else
        logMessage(
          `(Table #${this.tableSlotNumber}, Seat #${this.seatNumber}${
            this.isMyPlayer ? " - you" : ""
          }): Hole cards: ${this.holeCards
            .map((card) => `[${card}]`)
            .join(" ")}`,
          { color: this.isMyPlayer ? "goldenrod" : "lightblue" }
        );
    }

    return this.holeCards;
  }

  // Get a list of all player actions (e.g. "FOLD", "CHECK", "CALL", "BET", "RAISE", "ALL-IN", "ALL-IN · x%", "SITTING OUT", "POST SB", "POST BB", "x seconds left to make a move...", "NEW PLAYER") along with the action's timestamp (e.g. "2021-01-01 00:00:00.000")
  getCurrentAction() {
    // To get the player's current action DOM:
    // 1. Get the <div> tag with attribute "data-qa" with value "playerTag" or "myPlayerTag"
    // 2. Get the parent <div> of that <div>
    // 3. Get the first <div> tag within that <div> that does not have a "data-qa" attribute with a value of "playerTag" or "myPlayerTag" (don't check recursively, only check the first level of children)
    const currentActionDOM = this.dom
      .querySelector('div[data-qa="playerTag"], div[data-qa="myPlayerTag"]')
      ?.parentNode?.querySelector(
        ':scope > div:not([data-qa="playerTag"]):not([data-qa="myPlayerTag"])'
      );
    this.currentActionDOM = currentActionDOM;

    // Check if the player's current action DOM exists
    if (currentActionDOM) {
      // To get the player's current action:
      // 1. Within the player action DOM, there will be two <div> tags, one is has the opacity of 1 and the other has the opacity of 0, the one with opacity of 1 is the current player action
      // 2. Get the innerText of the <div> tag with style opacity of 1 within the current player action DOM, this is the current player action (note: the style tag may have other styles, e.g. style="opacity: 1; transition: opacity 600ms ease 0s;", so we can't just check if the style tag equals "opacity: 1", we have to check if it contains "opacity: 1")
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
      logMessage(
        `(Table #${this.tableSlotNumber}, Seat #${this.seatNumber}${
          this.isMyPlayer ? " - you" : ""
        }): Action updated: ${action.action} (at ${action.timestamp})`,
        {
          color: this.isMyPlayer
            ? "goldenrod"
            : action.action.includes("seconds left to make a move...")
            ? "lightgray"
            : "lightblue",
        }
      );
    }

    return this.actionHistory;
  }

  formatAction(action) {
    return (
      // Check if the action is just a number (e.g. "7" for "7 seconds left to make a move")
      !isNaN(action) ? `${action} seconds left to make a move...` : action
    );
  }

  getPlayerInfo() {
    return {
      balance: this.getBalance(),
      holeCards: this.getHoleCards(),
      actionHistory: this.getCurrentAction(),
    };
  }

  syncPlayerInfo() {
    this.getPlayerInfo();
    setInterval(() => this.getPlayerInfo(), TICK_RATE);
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

    this.board = [];
    this.players = new Map();

    this.totalPot;
    this.mainPot;
    this.sidePots = [];

    this.syncTableInfo();
  }

  getBoard() {
    // To get the table DOM:
    // 1. Get the first <img> with src starting with "./static/media/bkg-table-"
    // 2. Get the parent <div> of that <img>
    // 3. Get the first <svg> tag within that <div> and all of its children that has an attribute of "data-qa" with a value that starts with "card" and does not equal "card-placeholder"
    // 4. Get the 4th-level parent <div> of that <svg>, that's the table DOM
    this.tableDOM = Array.from(
      this.doc
        ?.querySelector('img[src^="./static/media/bkg-table-"]')
        ?.parentNode?.querySelectorAll('svg[data-qa^="card"]') || []
    ).filter(
      (node) => node.getAttribute("data-qa") !== "card-placeholder"
    )[0]?.parentNode?.parentNode?.parentNode?.parentNode;

    // To get the board:
    // 1. Get all <svg> tags within the table DOM that has an attribute of "data-qa" with a value that starts with "card"
    // 2. Get the "data-qa" attribute value of each <svg> tag
    // 3. Filter out all empty/placeholder cards (this is when the <svg> tag's "data-qa" attribute value equals "card-1")
    // 4. Remove all duplicate cards (by removing all duplicate "data-qa" attribute values from the <svg> tags)
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
      if (this.board.length === 0)
        logMessage(`(Table #${this.slotNumber}): The board has been cleared.`, {
          color: "lightblue",
        });
      else
        logMessage(
          `(Table #${this.slotNumber}): The board has been updated. ${this.board
            .map((card) => `[${card}]`)
            .join(" ")}`,
          { color: "lightblue" }
        );
    }

    return this.board;
  }

  getPlayers() {
    const previousPlayersSize = this.players.size;

    // To get all players DOM:
    // 1. Get all <div> tags with attribute "data-qa" with a value that starts with "playerContainer-"
    const playersSeatDOMs = Array.from(
      this.doc?.querySelectorAll('div[data-qa^="playerContainer-"]') || []
    );
    this.playersSeatDOMs = playersSeatDOMs;

    // Create a new Player instance for each player
    for (const seatDOM of playersSeatDOMs) {
      const seatNumber = this.getSeatNumber(seatDOM);
      if (!this.players.has(seatNumber) && !this.isSeatVacant(seatDOM)) {
        logMessage(
          `(Table #${this.slotNumber}): A player has joined seat #${seatNumber}.`,
          { color: "lightgray" }
        );
        this.players.set(
          seatNumber,
          new Player(seatDOM, seatNumber, this.slotNumber)
        );
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
          `(Table #${this.slotNumber}): A player has left seat #${seatNumber}.`,
          { color: "lightgray" }
        );
      }
    }

    // Log the other players if they have changed
    if (previousPlayersSize !== this.players.size) {
      logMessage(
        `(Table #${this.slotNumber}): Players: ${Array.from(
          this.players.values()
        )
          .map(
            (player) => `(#${player.seatNumber}) $${roundFloat(player.balance)}`
          )
          .join(" | ")}`,
        { color: "lightblue" }
      );
    }

    return this.players;
  }

  getSeatNumber(seatDOM) {
    return parseInt(seatDOM.getAttribute("data-qa").match(/\d+/g)[0]) + 1;
  }

  isSeatVacant(seatDOM) {
    // To check if a seat is vacant:
    // 1. Check if there is a <div> with attribute "data-qa" with a value of "player-empty-seat-panel"
    return (
      seatDOM.querySelector('div[data-qa="player-empty-seat-panel"]') !== null
    );
  }

  getTotalPot() {
    const totalPotText = this.doc.querySelector(
      'span[data-qa="totalPot"]'
    )?.innerText;
    const totalPot = totalPotText
      ? parseFloat(totalPotText.replace(/[$,]/g, ""))
      : undefined;

    // Update the total pot if it has changed
    if (totalPot !== undefined && this.totalPot !== totalPot) {
      this.totalPot = totalPot;
      logMessage(
        `(Table #${this.slotNumber}): Total pot updated: $${roundFloat(
          this.totalPot
        )}`,
        { color: "lightblue" }
      );
    }

    return this.totalPot;
  }

  getMainPot() {
    const mainPotText = this.doc.querySelector(
      'span[data-qa="totalPot-0"]'
    )?.innerText;
    const mainPot = mainPotText
      ? parseFloat(mainPotText.replace(/[$,]/g, ""))
      : undefined;

    // Update the main pot if it has changed
    if (mainPot !== undefined && this.mainPot !== mainPot) {
      this.mainPot = mainPot;
      logMessage(
        `(Table #${this.slotNumber}): Main pot updated: $${roundFloat(
          this.mainPot
        )}`,
        { color: "lightblue" }
      );
    }

    return this.mainPot;
  }

  getSidePots() {
    const sidePotsDOM = Array.from(
      this.doc.querySelectorAll('span[data-qa^="totalPot-"]') || []
    )
      // Exclude the main pot from the side pots
      .filter((span) => span.getAttribute("data-qa") !== "totalPot-0");
    const sidePots = sidePotsDOM.map((span) =>
      parseFloat(span.innerText.replace(/[$,]/g, ""))
    );

    // Update the side pots if they have changed
    if (JSON.stringify(this.sidePots) !== JSON.stringify(sidePots)) {
      this.sidePots = sidePots;
      logMessage(
        `(Table #${this.slotNumber}): Side pots updated: ${this.sidePots
          .map((pot, potIndex) => `(#${potIndex + 1}) $${roundFloat(pot)}`)
          .join(" | ")}`,
        { color: "lightblue" }
      );
    }

    return this.sidePots;
  }

  getTableInfo() {
    return {
      board: this.getBoard(),
      players: this.getPlayers(),
      totalPot: this.getTotalPot(),
      mainPot: this.getMainPot(),
      sidePots: this.getSidePots(),
    };
  }

  syncTableInfo() {
    this.getTableInfo();
    setInterval(() => this.getTableInfo(), TICK_RATE);
  }
}

// To format a card (from the "data-qa" attribute value):
// 1. Get all numbers from the string
// 2. Convert the numbers to the formatted card (e.g. "card9" is the 10 of clubs, or "10c" as we call it)
// Note: clubs are numbers in range 0-12, diamonds are 13-25, hearts are 26-38, and spades are 39-51
// ac = 0, 2c = 1, 3c = 2, 4c = 3, 5c = 4, 6c = 5, 7c = 6, 8c = 7, 9c = 8, 10c = 9, jc = 10, qc = 11, kc = 12
// ad = 13, 2d = 14, 3d = 15, 4d = 16, 5d = 17, 6d = 18, 7d = 19, 8d = 20, 9d = 21, 10d = 22, jd = 23, qd = 24, kd = 25
// ah = 26, 2h = 27, 3h = 28, 4h = 29, 5h = 30, 6h = 31, 7h = 32, 8h = 33, 9h = 34, 10h = 35, jh = 36, qh = 37, kh = 38
// as = 39, 2s = 40, 3s = 41, 4s = 42, 5s = 43, 6s = 44, 7s = 45, 8s = 46, 9s = 47, 10s = 48, js = 49, qs = 50, ks = 51
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

// Exit the script
function exit(silent = false) {
  clearAllIntervals();
  pokerTables.clear();
  if (!silent)
    logMessage("Now exiting PokerEye+ (Plus) for Ignition Casino...", {
      color: "crimson",
    });
}

// Main function (self-invoking)
const main = (function main() {
  exit(true);
  syncPokerTableSlots();
  setInterval(syncPokerTableSlots, 1000);
  return main;
})();

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
