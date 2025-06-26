// Tab functionality
const tabs = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

function activateTab(tabToActivate) {
  if (!tabToActivate) return;
  tabs.forEach((t) => t.classList.remove("active"));
  tabToActivate.classList.add("active");
  const target = document.getElementById(tabToActivate.dataset.tab);
  tabContents.forEach((content) => content.classList.remove("active"));
  target.classList.add("active");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Prevent user from switching tabs if the UI is locked for corruption
    if (
      navigationColumn.classList.contains("locked") &&
      !tab.classList.contains("active")
    ) {
      return;
    }
    activateTab(tab);
  });
});

// --- GLOBAL STATE ---
let gameState = {
  profiles: [],
  selected_profile_index: 0,
};
let corruptProfileAlertShown = false; // Flag to prevent repeated alerts
let recentGains = { xp: {}, items: {} };
let gainsTimeout;

// --- DOM ELEMENTS ---
const profileSelector = document.getElementById("profile-selector");
const profileSelectedLabel = document.getElementById("profile-selected-label");
const profileOptions = document.getElementById("profile-options");
const homeProfileName = document.getElementById("home-profile-name");
const sidebarProfileName = document.getElementById("sidebar-profile-name");
const newProfileButton = document.getElementById("new-profile-button");
const renameProfileButton = document.getElementById("rename-profile-button");
const deleteProfileButton = document.getElementById("delete-profile-button");
const hardResetButton = document.getElementById("hard-reset-button");
const resetProfileButton = document.getElementById("reset-profile-button");
const resetSettingsButton = document.getElementById("reset-settings-button");
const loadingOverlay = document.getElementById("loading-overlay");
const mainContainer = document.querySelector(".container");
const inventoryContainer = document.getElementById("inventory-container");
const statsContainer = document.getElementById("stats-container");
const rightStatsContainer = document.getElementById("right-stats-container");
const recentlyObtainedContainer = document.getElementById(
  "recently-obtained-container"
);
const navigationColumn = document.querySelector(".left-column");
const migrateProfileButton = document.getElementById("migrate-profile-button");
const migrationControls = document.querySelector(".migration-controls");

// --- API COMMUNICATION ---
async function fetchApi(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error;
      } catch (e) {
        errorMessage = `Request failed with status: ${response.status} ${response.statusText}`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);

    let title = "Error"; // Default title
    switch (error.status) {
      case 400:
        title = "Invalid Input";
        break;
      case 403:
        title = "Action Not Allowed";
        break;
      case 409:
        title = "Name Unavailable";
        break;
      case 501:
        title = "Feature Not Available";
        break;
      default:
        title = "System Error";
        break;
    }

    showAlert(title, error.message);
    return null;
  }
}

// --- SETTINGS API ---
async function saveSettings(partial) {
  await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partial),
  });
}

// --- RENDER & UI UPDATE FUNCTIONS ---
function renderAll(newState) {
  if (!newState || !newState.profiles || newState.profiles.length === 0) {
    console.error("Cannot render: Invalid game state.", newState);
    return;
  }
  gameState = newState;
  const profile = gameState.profiles[gameState.selected_profile_index];
  if (!profile) {
    console.error("Cannot render: Selected profile is missing.");
    return;
  }

  handleProfileStatus(profile);

  profileSelectedLabel.innerHTML = `<span>${profile.name}</span><span class="profile-info">Lvl: ${profile.total_level}</span>`;
  if (profile.status === "corrupt") {
    profileSelectedLabel.innerHTML += ` <span style="color:red;">(Corrupt)</span>`;
  }
  homeProfileName.textContent = profile.name;
  sidebarProfileName.textContent = profile.name;

  renderProfileOptions();
  renderSkills();
  renderInventory();
  renderStatsPage();
  renderStats();
  renderRecentlyObtained();
}

function triggerWelcomeHighlight() {
  // Remove the class to allow re-triggering the animation
  homeProfileName.classList.remove("highlight-profile-name");
  // We use a trick with void to restart the animation
  void homeProfileName.offsetWidth;
  homeProfileName.classList.add("highlight-profile-name");
}

function handleProfileStatus(profile) {
  const isCorrupt = profile.status === "corrupt";

  document
    .querySelectorAll(".action-button")
    .forEach((btn) => (btn.disabled = isCorrupt));
  renameProfileButton.disabled = isCorrupt;
  hardResetButton.disabled = isCorrupt;
  deleteProfileButton.disabled = false;

  migrationControls.style.display = isCorrupt ? "block" : "none";

  if (isCorrupt) {
    const settingsTabButton = document.querySelector(
      '.tab-button[data-tab="settings"]'
    );
    activateTab(settingsTabButton);
    navigationColumn.classList.add("locked");

    if (!corruptProfileAlertShown) {
      showAlert(
        "Profile Corrupt",
        `The profile "${profile.name}" is corrupt or outdated. All actions are disabled. Please go to the Settings tab to fix or delete it.`
      );
      corruptProfileAlertShown = true;
    }
  } else {
    navigationColumn.classList.remove("locked");
    corruptProfileAlertShown = false;
  }

  if (isCorrupt) {
    resetProfileButton.textContent = "Fix Corrupt Profile";
    resetProfileButton.classList.add("warning-zone-button");
    resetProfileButton.classList.remove("danger-zone-button");
  } else {
    resetProfileButton.textContent = "Reset Current Profile";
    resetProfileButton.classList.remove("warning-zone-button");
    resetProfileButton.classList.add("danger-zone-button");
  }
}

function renderProfileOptions() {
  profileOptions.innerHTML = "";
  gameState.profiles.forEach((profile, index) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.dataset.index = index;
    let displayName = `<span>${profile.name}</span> <span class="profile-info">Lvl: ${profile.total_level}</span>`;
    if (profile.status === "corrupt") {
      displayName += ` <span style="color:red;">(Corrupt)</span>`;
    }
    item.innerHTML = displayName;

    item.addEventListener("click", async (e) => {
      e.stopPropagation();
      const newIndex = parseInt(e.currentTarget.dataset.index, 10);

      const newState = await fetchApi("/api/profile/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: newIndex }),
      });
      if (newState) {
        corruptProfileAlertShown = false;
        renderAll(newState);

        activateTab(document.querySelector('.tab-button[data-tab="home"]'));
        triggerWelcomeHighlight();
      }
      toggleDropdown(e.currentTarget.closest(".custom-dropdown"));
    });
    profileOptions.appendChild(item);
  });
}

function formatNumber(num) {
  if (num < 1000) return num;
  const suffixes = ["", "k", "M", "B", "T"];
  const i = Math.floor(Math.log10(num) / 3);
  return (num / Math.pow(1000, i)).toFixed(2) + suffixes[i];
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function renderSkills() {
  const skillsContainer = document.getElementById("skills-container");
  skillsContainer.innerHTML = "";
  const profile = gameState.profiles[gameState.selected_profile_index];
  if (profile.status === "corrupt") {
    skillsContainer.innerHTML =
      "<p>This profile is corrupt. Skills cannot be displayed.</p>";
    return;
  }
  if (profile && profile.data && profile.data.skills) {
    const skills = profile.data.skills;
    for (const skillName in skills) {
      const skill = skills[skillName];
      const percentage =
        skill.xp_to_next_level > 0
          ? (skill.current_xp / skill.xp_to_next_level) * 100
          : 0;
      const textContent = `${formatNumber(skill.current_xp)} / ${formatNumber(
        skill.xp_to_next_level
      )}`;
      const skillHTML = `
          <div class="skill">
              <div class="skill-name"><span>${toTitleCase(
                skillName
              )}</span><span>Level: ${skill.level}</span></div>
              <div class="skill-bar-container">
                  <div class="skill-bar" style="width: ${percentage}%;"></div>
                  <div class="skill-text">${textContent}</div>
                  <div class="skill-text-foreground" style="clip-path: inset(0 ${
                    100 - percentage
                  }% 0 0);">${textContent}</div>
              </div>
          </div>`;
      skillsContainer.innerHTML += skillHTML;
    }
  }
}

function renderInventory() {
  inventoryContainer.innerHTML = "";
  const profile = gameState.profiles[gameState.selected_profile_index];
  if (profile.status === "corrupt") {
    inventoryContainer.innerHTML =
      "<p>This profile is corrupt. Inventory cannot be displayed.</p>";
    return;
  }
  if (
    profile &&
    profile.data &&
    profile.data.inventory &&
    Object.keys(profile.data.inventory).length > 0
  ) {
    for (const [itemName, quantity] of Object.entries(profile.data.inventory)) {
      inventoryContainer.innerHTML += `<div class="resource-display"><span>${itemName}: </span><span id="${itemName.toLowerCase()}">${quantity}</span></div>`;
    }
  } else {
    inventoryContainer.innerHTML = "<p>Your inventory is empty.</p>";
  }
}

const statExplanations = {
  strength:
    "Increases physical power. Derived from Mining. Affects combat effectiveness and carry capacity.",
  intelligence:
    "Enhances mental acuity. Derived from Foraging. Influences crafting success rates and the ability to learn new skills.",
  dexterity:
    "Improves agility and precision. Derived from Woodcutting. Boosts resource gathering speed and critical hit chances.",
};

function renderStatsPage() {
  statsContainer.innerHTML = "";
  const profile = gameState.profiles[gameState.selected_profile_index];
  if (profile.status === "corrupt") {
    statsContainer.innerHTML =
      "<p>This profile is corrupt. Stats cannot be displayed.</p>";
    return;
  }
  if (profile && profile.data && profile.data.stats) {
    for (const [statName, value] of Object.entries(profile.data.stats)) {
      statsContainer.innerHTML += `
        <div class="stat-explanation">
            <h3>${toTitleCase(statName)}: ${value}</h3>
            <p>${statExplanations[statName]}</p>
        </div>`;
    }
  }
}

function renderStats() {
  rightStatsContainer.innerHTML = "";
  const profile = gameState.profiles[gameState.selected_profile_index];

  if (profile.status === "corrupt") {
    rightStatsContainer.innerHTML += `
            <div class="stat-display"><span>Strength: </span><span>N/A</span></div>
            <div class="stat-display"><span>Intelligence: </span><span>N/A</span></div>
            <div class="stat-display"><span>Dexterity: </span><span>N/A</span></div>`;
    return;
  }

  if (profile && profile.data && profile.data.stats) {
    for (const [statName, value] of Object.entries(profile.data.stats)) {
      rightStatsContainer.innerHTML += `<div class="stat-display"><span>${toTitleCase(
        statName
      )}: </span><span>${value}</span></div>`;
    }
  }
}

function renderRecentlyObtained() {
  let hasGains = false;
  let content = "";
  for (const [skill, xp] of Object.entries(recentGains.xp)) {
    if (xp > 0) {
      hasGains = true;
      content += `<div class="gain-display">+${xp} ${skill} XP</div>`;
    }
  }
  for (const [item, quantity] of Object.entries(recentGains.items)) {
    if (quantity > 0) {
      hasGains = true;
      content += `<div class="gain-display">+${quantity} ${item}</div>`;
    }
  }

  recentlyObtainedContainer.innerHTML = content;

  if (hasGains) {
    recentlyObtainedContainer.classList.add("visible");
    recentlyObtainedContainer.style.maxHeight =
      recentlyObtainedContainer.scrollHeight + "px";
  } else {
    recentlyObtainedContainer.classList.remove("visible");
    recentlyObtainedContainer.style.maxHeight = "0";
  }
}

// --- EVENT LISTENERS ---
async function handleAction(event) {
  const actionId = event.currentTarget.id;
  const newState = await fetchApi("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action_id: actionId }),
  });
  if (newState) {
    // Aggregate gains
    if (newState.recent_gain) {
      const gain = newState.recent_gain;
      if (gain.skill && gain.xp) {
        recentGains.xp[gain.skill] =
          (recentGains.xp[gain.skill] || 0) + gain.xp;
      }
      if (gain.item && gain.quantity) {
        recentGains.items[gain.item] =
          (recentGains.items[gain.item] || 0) + gain.quantity;
      }
    }

    // Reset the fade-out timer
    clearTimeout(gainsTimeout);
    gainsTimeout = setTimeout(() => {
      recentGains = { xp: {}, items: {} };
      renderRecentlyObtained();
    }, 3000); // Hide after 3 seconds of inactivity

    renderAll(newState);
  }
}

["gather-wood-button", "mine-stone-button", "forage-herbs-button"].forEach(
  (id) => {
    document.getElementById(id).addEventListener("click", handleAction);
  }
);

migrateProfileButton.addEventListener("click", async () => {
  await fetchApi("/api/profile/migrate", { method: "POST" });
});

newProfileButton.addEventListener("click", () => {
  showInputModal(
    "Create New Profile",
    "Enter a name for your new profile:",
    async (newName) => {
      if (newName && newName.trim() !== "") {
        const newState = await fetchApi("/api/profile/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim() }),
        });
        if (newState) {
          renderAll(newState);
          activateTab(document.querySelector('.tab-button[data-tab="home"]'));
          triggerWelcomeHighlight();
        }
      }
    }
  );
});

renameProfileButton.addEventListener("click", () => {
  const currentProfile = gameState.profiles[gameState.selected_profile_index];
  showInputModal(
    "Rename Profile",
    `Enter a new name for "${currentProfile.name}":`,
    async (newName) => {
      if (newName && newName.trim() !== "") {
        const newState = await fetchApi("/api/profile/rename", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim() }),
        });
        if (newState) {
          renderAll(newState);
        }
      }
    },
    currentProfile.name
  );
});

deleteProfileButton.addEventListener("click", () => {
  if (gameState.profiles.length <= 1) {
    showAlert("Action Blocked", "You cannot delete the last profile.");
    return;
  }
  const currentProfile = gameState.profiles[gameState.selected_profile_index];
  const confirmPhrase = `delete ${currentProfile.name}`;
  showInputModal(
    "Delete Profile",
    `This action cannot be undone. To confirm, please type "${confirmPhrase}" in the box below.`,
    async (inputValue) => {
      if (inputValue === confirmPhrase) {
        const newState = await fetchApi("/api/profile/delete", {
          method: "DELETE",
        });
        if (newState) {
          renderAll(newState);
          showAlert(
            "Success",
            `Profile "${currentProfile.name}" has been deleted.`
          );
        }
      } else {
        showAlert("Action Cancelled", "The text you entered did not match.");
      }
    }
  );
});

hardResetButton.addEventListener("click", () => {
  const confirmPhrase = "reset all game data";
  showInputModal(
    "Reset All Game Data",
    `This is the most destructive action. It will delete all profiles and progress and cannot be undone. To confirm, please type "${confirmPhrase}" in the box below.`,
    async (inputValue) => {
      if (inputValue === confirmPhrase) {
        const newState = await fetchApi("/api/hard-reset", { method: "POST" });
        if (newState) {
          renderAll(newState);
          showAlert("Success", "All game data has been reset.");
        }
      } else {
        showAlert("Action Cancelled", "The text you entered did not match.");
      }
    }
  );
});

resetProfileButton.addEventListener("click", async () => {
  const selectedIndex = gameState.selected_profile_index;
  const currentProfile = gameState.profiles[selectedIndex];

  if (currentProfile.status === "corrupt") {
    const confirmText = `This will reset the corrupt profile "${currentProfile.name}" to a new, empty state. Your other profiles will not be affected. Are you sure?`;
    showConfirmation("Confirm Profile Fix", confirmText, async () => {
      const newState = await fetchApi("/api/profile/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: selectedIndex }),
      });
      if (newState) {
        renderAll(newState);
        showAlert(
          "Success",
          `Profile "${currentProfile.name}" has been fixed and reset.`
        );
      }
    });
  } else {
    const confirmPhrase = `reset ${currentProfile.name}`;
    showInputModal(
      "Reset Profile",
      `This action cannot be undone. To confirm, please type "${confirmPhrase}" in the box below.`,
      async (inputValue) => {
        if (inputValue === confirmPhrase) {
          const newState = await fetchApi("/api/profile/reset", {
            method: "POST",
          });
          if (newState) {
            renderAll(newState);
            showAlert(
              "Success",
              `Profile "${currentProfile.name}" has been reset.`
            );
          }
        } else {
          showAlert("Action Cancelled", "The text you entered did not match.");
        }
      }
    );
  }
});

resetSettingsButton.addEventListener("click", () => {
  const confirmPhrase = "reset settings";
  showInputModal(
    "Reset Settings",
    `This will restore the default theme, font, and font size. To confirm, please type "${confirmPhrase}" in the box below.`,
    (inputValue) => {
      if (inputValue === confirmPhrase) {
        localStorage.removeItem("selectedTheme");
        localStorage.removeItem("selectedFont");
        localStorage.removeItem("fontSize");
        window.location.reload();
      } else {
        showAlert("Action Cancelled", "The text you entered did not match.");
      }
    }
  );
});

// --- UI HELPERS ---
function toggleDropdown(dropdownElement) {
  if (!dropdownElement) return;
  const options = dropdownElement.querySelector(".custom-dropdown-options");
  const arrow = dropdownElement.querySelector(".dropdown-arrow");
  options.classList.toggle("show");
  arrow.classList.toggle("open");
}

document
  .getElementById("profile-selector")
  .addEventListener("click", (event) =>
    toggleDropdown(event.currentTarget.closest(".custom-dropdown"))
  );
document
  .getElementById("theme-selector")
  .addEventListener("click", (event) =>
    toggleDropdown(event.currentTarget.closest(".custom-dropdown"))
  );
document
  .getElementById("font-selector")
  .addEventListener("click", (event) =>
    toggleDropdown(event.currentTarget.closest(".custom-dropdown"))
  );

document.addEventListener("click", (e) => {
  // Add a defensive check to ensure the event target exists
  if (!e.target) return;

  if (!e.target.closest(".custom-dropdown")) {
    document
      .querySelectorAll(".custom-dropdown-options.show")
      .forEach((options) => {
        const dropdown = options.closest(".custom-dropdown");
        if (dropdown) {
          // Correctly select the arrow and flip its state
          const arrow = dropdown.querySelector(".dropdown-arrow");
          options.classList.remove("show");
          if (arrow) arrow.classList.remove("open");
        }
      });
  }
});

// --- FONT CHANGER ---
const fonts = [
  { name: "Courier New", value: `"Courier New", Courier, monospace` },
  { name: "monospace", value: `monospace` },
  { name: "Inconsolata", value: `'Inconsolata', monospace` },
  { name: "Roboto Mono", value: `'Roboto Mono', monospace` },
  { name: "Source Code Pro", value: `'Source Code Pro', monospace` },
  { name: "Space Mono", value: `'Space Mono', monospace` },
  { name: "Ubuntu Mono", value: `'Ubuntu Mono', monospace` },
  { name: "Fira Code", value: `'Fira Code', monospace` },
];
let selectedFontIndex = 0;
const fontSelector = document.getElementById("font-selector");
const fontSelectedLabel = document.getElementById("font-selected-label");
const fontOptions = document.getElementById("font-options");

function applyFont() {
  const font = fonts[selectedFontIndex].value;
  document.documentElement.style.setProperty("--font-family", font);
  saveSettings({ font });
}

function updateFontDisplay() {
  fontSelectedLabel.innerHTML = `<span>${fonts[selectedFontIndex].name}</span>`;
}

function renderFontOptions() {
  fontOptions.innerHTML = "";
  fonts.forEach((font, index) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.dataset.index = index;
    item.textContent = font.name;
    item.style.fontFamily = font.value;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedFontIndex = index;
      updateFontDisplay();
      applyFont();
      toggleDropdown(e.currentTarget.closest(".custom-dropdown"));
    });
    fontOptions.appendChild(item);
  });
}

// --- FONT SIZE CHANGER ---
const fontSizeSlider = document.getElementById("font-size-slider");
const fontSizeValue = document.getElementById("font-size-value");
let currentFontSize = 16;

function applyFontSize() {
  document.documentElement.style.setProperty(
    "--font-size",
    `${currentFontSize}px`
  );
  saveSettings({ font_size: currentFontSize });
}

function updateFontSizeDisplay() {
  fontSizeValue.textContent = `${currentFontSize}px`;
  fontSizeSlider.value = currentFontSize;
}

fontSizeSlider.addEventListener("input", (e) => {
  currentFontSize = e.target.value;
  updateFontSizeDisplay();
  applyFontSize();
});

// --- THEME CHANGER ---
const themes = [
  { value: "dark", name: "Dark" },
  { value: "light", name: "Light" },
  { value: "blue", name: "Blue" },
  { value: "dracula", name: "Dracula" },
  { value: "solarized", name: "Solarized" },
  { value: "matrix", name: "Matrix" },
  { value: "cyberpunk", name: "Cyberpunk" },
  { value: "gruvbox", name: "Gruvbox" },
  { value: "nord", name: "Nord" },
  { value: "monokai", name: "Monokai" },
  { value: "tomorrow-night", name: "Tomorrow Night" },
  { value: "oceanic-next", name: "Oceanic Next" },
  { value: "one-dark", name: "One Dark" },
  { value: "gothic", name: "Gothic" },
  { value: "pink", name: "Pink" },
];
let selectedThemeIndex = 0;
const themeSelector = document.getElementById("theme-selector");
const themeSelectedLabel = document.getElementById("theme-selected-label");
const themeOptions = document.getElementById("theme-options");

function applyTheme() {
  const theme = themes[selectedThemeIndex].value;
  document.body.dataset.theme = theme;
  saveSettings({ theme });
}

function updateThemeDisplay() {
  themeSelectedLabel.innerHTML = `<span>${themes[selectedThemeIndex].name}</span>`;
}

function renderThemeOptions() {
  themeOptions.innerHTML = "";
  themes.forEach((theme, index) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.dataset.index = index;
    item.textContent = theme.name;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedThemeIndex = index;
      updateThemeDisplay();
      applyTheme();
      toggleDropdown(e.currentTarget.closest(".custom-dropdown"));
    });
    themeOptions.appendChild(item);
  });
}

// --- MODALS (Confirmation, Alert, Input) ---
const confirmationModal = document.getElementById("confirmation-modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalConfirmButton = document.getElementById("modal-confirm-button");
const modalCancelButton = document.getElementById("modal-cancel-button");

let onConfirmCallback = null;

function showConfirmation(title, text, onConfirm) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  onConfirmCallback = onConfirm;
  modalConfirmButton.textContent = "Confirm";
  modalCancelButton.style.display = "inline-block";
  confirmationModal.style.display = "flex";
}

function showAlert(title, text) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  onConfirmCallback = null; // No action on confirm, just close
  modalConfirmButton.textContent = "OK";
  modalCancelButton.style.display = "none";
  confirmationModal.style.display = "flex";
}

modalConfirmButton.addEventListener("click", () => {
  if (onConfirmCallback) {
    onConfirmCallback();
  }
  confirmationModal.style.display = "none";
  onConfirmCallback = null;
});
modalCancelButton.addEventListener("click", () => {
  confirmationModal.style.display = "none";
  onConfirmCallback = null;
});

const inputModal = document.getElementById("input-modal");
const inputModalTitle = document.getElementById("input-modal-title");
const inputModalText = document.getElementById("input-modal-text");
const inputModalField = document.getElementById("input-modal-field");
const inputModalConfirmButton = document.getElementById(
  "input-modal-confirm-button"
);
const inputModalCancelButton = document.getElementById(
  "input-modal-cancel-button"
);

let onInputConfirmCallback = null;

function showInputModal(title, text, onConfirm, defaultValue = "") {
  inputModalTitle.textContent = title;
  inputModalText.textContent = text;
  inputModalField.value = defaultValue;
  onInputConfirmCallback = onConfirm;
  inputModal.style.display = "flex";
  inputModalField.focus();
}

inputModalConfirmButton.addEventListener("click", () => {
  if (onInputConfirmCallback) {
    onInputConfirmCallback(inputModalField.value);
  }
  inputModal.style.display = "none";
  onInputConfirmCallback = null;
});
inputModalCancelButton.addEventListener("click", () => {
  inputModal.style.display = "none";
  onInputConfirmCallback = null;
});
inputModalField.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    inputModalConfirmButton.click();
  }
});

// --- INITIAL LOAD ---
document.addEventListener("DOMContentLoaded", async () => {
  // Settings
  let settings = {};
  try {
    const resp = await fetch("/api/settings");
    if (resp.ok) {
      settings = await resp.json();
    }
  } catch (e) {}
  // Theme
  if (settings.theme) {
    const savedThemeIndex = themes.findIndex((t) => t.value === settings.theme);
    if (savedThemeIndex !== -1) selectedThemeIndex = savedThemeIndex;
  }
  renderThemeOptions();
  updateThemeDisplay();
  applyTheme();
  // Font
  if (settings.font) {
    const savedFontIndex = fonts.findIndex((f) => f.value === settings.font);
    if (savedFontIndex !== -1) selectedFontIndex = savedFontIndex;
  }
  renderFontOptions();
  updateFontDisplay();
  applyFont();
  // Font Size
  if (settings.font_size) {
    currentFontSize = settings.font_size;
  }
  updateFontSizeDisplay();
  applyFontSize();

  // Game State
  const initialState = await fetchApi("/api/game-state");
  if (initialState) {
    renderAll(initialState);

    loadingOverlay.style.display = "none";
    mainContainer.style.display = "flex";
    triggerWelcomeHighlight();
  } else {
    loadingOverlay.innerHTML = `<div class="loading-text">Error: Could not connect to the game server. Please try again later.</div>`;
  }
});
