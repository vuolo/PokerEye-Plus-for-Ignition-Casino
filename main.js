class PokerTable {
  constructor(iframe, index) {
    this.iframe = iframe;
    this.index = index;
    this.board = [];
    this.init();
  }

  init() {
    this.doc = this.iframe.contentWindow?.document;
    this.getBoard();
    this.syncBoard();
  }

  getBoard() {
    // To get the board DOM:
    // 1. Get the first <img> with src starting with "./static/media/bkg-table-"
    // 2. Get the parent <div> of that <img>
    // 3. Get the first <svg> tag within that <div> and all of its children that has an attribute of "data-qa" with a value that starts with "card-" and does not equal "card-placeholder"
    // 4. Get the 4th-level parent <div> of that <svg>, that's the board DOM
    if (!this.boardDOM)
      this.boardDOM = Array.from(
        this.doc
          ?.querySelector('img[src^="./static/media/bkg-table-"]')
          ?.parentNode?.querySelectorAll('svg[data-qa^="card"]') || []
      ).filter(
        (node) => node.getAttribute("data-qa") !== "card-placeholder"
      )[0]?.parentNode?.parentNode?.parentNode?.parentNode;

    // To get the board:
    // 1. Get all <svg> tags within the board DOM that has an attribute of "data-qa" with a value that starts with "card-"
    // 2. Get the "data-qa" attribute value of each <svg> tag
    // 3. Filter out all empty/placeholder cards (this is when the <svg> tag's "data-qa" attribute value equals "card-1")
    // 4. Remove all duplicate cards (by removing all duplicate "data-qa" attribute values from the <svg> tags)
    const newBoard = Array.from(
      this.boardDOM?.querySelectorAll('svg[data-qa^="card"]') || []
    )
      .map((svg) => svg.getAttribute("data-qa"))
      // Filter out empty/placeholder cards
      .filter((card) => card !== "card-1")
      // Remove duplicate cards
      .filter((card, index, cards) => cards.indexOf(card) === index)
      .map((card) => formatCard(card));

    // Update the board if it has changed
    if (JSON.stringify(newBoard) !== JSON.stringify(this.board)) {
      this.board = newBoard;
      if (this.board.length === 0)
        logMessage(`The board has been cleared on table #${this.index + 1}`, {
          color: "lightblue",
        });
      else
        logMessage(
          `The board has been updated on table #${this.index + 1}: ${this.board
            .map((card) => `[${card}]`)
            .join(" ")}`,
          { color: "lightblue" }
        );
    }

    return this.board;
  }

  syncBoard() {
    setInterval(() => this.getBoard(), 100);
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
  const numbers = unformattedCard.match(/\d+/g);
  return numbers?.map((num) => {
    const number = parseInt(num);
    const suit = Math.floor(number / 13);
    return `${
      ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][
        number % 13
      ]
    }${"cdhs"[suit]}`;
  });
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
    const slot = getMultitableSlot(iframe);
    if (slot !== -1 && !pokerTables.has(slot)) {
      pokerTables.set(slot, new PokerTable(iframe, slot));
      logMessage(
        "A new poker table has been detected (slot #" + (slot + 1) + ")",
        {
          color: "limegreen",
        }
      );
    }
  }
}

// Remove closed poker table slots
function removeClosedPokerTableSlots(iframes = getTableSlotIFrames()) {
  for (const slot of pokerTables.keys()) {
    if (!iframes.some((iframe) => getMultitableSlot(iframe) === slot)) {
      pokerTables.delete(slot);
      logMessage("A poker table has been closed (slot #" + (slot + 1) + ")", {
        color: "red",
      });
    }
  }
}

// Get all "Table slot" iframes and convert the resultant NodeList to Array (for more utility)
const getTableSlotIFrames = () =>
  Array.from(document.querySelectorAll('iframe[title="Table slot"]'));

const getMultitableSlot = (iframe) =>
  parseInt(iframe.getAttribute("data-multitableslot"));

// Main function (self-invoking)
const main = (function main() {
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
