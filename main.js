// Initialize a Map to store the lobby and poker table iframes
const pokerTables = new Map();

function checkForChanges() {
  // Get all "Table slot" iframes and convert the resultant NodeList to Array (for more utility)
  const iframes = Array.from(
    document.querySelectorAll('iframe[title="Table slot"]')
  );

  // Assign the lobby and new poker table iframes
  for (const iframe of iframes) {
    const multitableslot = iframe.getAttribute("data-multitableslot");
    if (multitableslot === "-1") pokerTables.set(multitableslot, iframe);
    else if (!pokerTables.has(multitableslot)) {
      pokerTables.set(multitableslot, iframe);
      console.log(
        "%c%s",
        "color: ForestGreen; font-size: 1.2em; font-weight: bold;",
        "Poker table started"
      );
    }
  }

  // Check for closed poker tables
  for (const key of pokerTables.keys()) {
    if (key === "-1") continue;
    if (
      !iframes.some(
        (iframe) => iframe.getAttribute("data-multitableslot") === key
      )
    ) {
      pokerTables.delete(key);
      console.log(
        "%c%s",
        "color: Crimson; font-size: 1.2em; font-weight: bold;",
        "Poker table closed"
      );
    }
  }
}

// Check for changes every second
setInterval(checkForChanges, 1000);
