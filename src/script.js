// Tab functionality
const tabs = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = document.getElementById(tab.dataset.tab);
    tabContents.forEach((content) => content.classList.remove("active"));
    target.classList.add("active");
  });
});

// --- GLOBAL STATE ---
let gameState = {
  profiles: [],
  selectedProfileIndex: 0,
};

// --- DOM ELEMENTS ---
const profileSelector = document.getElementById("profile-selector");
const profileSelectedLabel = document.getElementById("profile-selected-label");
const profileOptions = document.getElementById("profile-options");
const homeProfileName = document.getElementById("home-profile-name");
const currentProfileName = document.getElementById("current-profile-name");
const newProfileButton = document.getElementById("new-profile-button");
const renameProfileButton = document.getElementById("rename-profile-button");
const deleteProfileButton = document.getElementById("delete-profile-button");
const hardResetButton = document.getElementById("hard-reset-button");
const resetProfileButton = document.getElementById("reset-profile-button");
const resetSettingsButton = document.getElementById("reset-settings-button");
const loadingOverlay = document.getElementById("loading-overlay");
const mainContainer = document.querySelector(".container");
const inventoryContainer = document.getElementById("inventory-container");
const recentlyObtainedContainer = document.getElementById("recently-obtained-container");

// --- API COMMUNICATION ---
async function fetchApi(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "An unknown API error occurred.");
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    showAlert(`Error: ${error.message}`); // Use custom alert
    return null;
  }
}

// --- RENDER FUNCTIONS ---
function renderAll() {
  if (!gameState || !gameState.profiles || gameState.profiles.length === 0) {
    console.error("Cannot render: Invalid game state.", gameState);
    return;
  }
  const profile = gameState.profiles[gameState.selectedProfileIndex];
  if (!profile) {
    console.error("Cannot render: Selected profile is missing.");
    return;
  }
  profileSelectedLabel.innerHTML = `<span>${profile.name}</span><span class="profile-info">Lvl: ${profile.totalLevel}</span>`;
  homeProfileName.textContent = profile.name;
  currentProfileName.textContent = profile.name;
  renderProfileOptions();
  renderSkills();
  renderInventory();
  renderRecentlyObtained();
}

function renderProfileOptions() {
  profileOptions.innerHTML = "";
  gameState.profiles.forEach((profile, index) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.dataset.index = index;
    item.innerHTML = `<span>${profile.name}</span> <span class="profile-info">Lvl: ${profile.totalLevel}</span>`;
    item.addEventListener("click", async (e) => {
      e.stopPropagation();
      const newIndex = parseInt(e.currentTarget.dataset.index, 10);
      const newState = await fetchApi("/api/profile/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: newIndex }),
      });
      if (newState) {
        gameState = newState;
        renderAll();
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

function renderSkills() {
  const skillsContainer = document.getElementById("skills-container");
  skillsContainer.innerHTML = "";
  const profile = gameState.profiles[gameState.selectedProfileIndex];
  if (profile && profile.data && profile.data.skills) {
    const skills = profile.data.skills;
    for (const skillName in skills) {
      const skill = skills[skillName];
      const percentage = skill.xpToNextLevel > 0 ? (skill.currentXP / skill.xpToNextLevel) * 100 : 0;
      const textContent = `${formatNumber(skill.currentXP)} / ${formatNumber(skill.xpToNextLevel)}`;
      const skillHTML = `
          <div class="skill">
              <div class="skill-name"><span>${skillName}</span><span>Level: ${skill.level}</span></div>
              <div class="skill-bar-container">
                  <div class="skill-bar" style="width: ${percentage}%;"></div>
                  <div class="skill-text">${textContent}</div>
                  <div class="skill-text-foreground" style="clip-path: inset(0 ${100 - percentage}% 0 0);">${textContent}</div>
              </div>
          </div>`;
      skillsContainer.innerHTML += skillHTML;
    }
  }
}

function renderInventory() {
  inventoryContainer.innerHTML = "";
  const profile = gameState.profiles[gameState.selectedProfileIndex];
  if (profile && profile.data && profile.data.inventory && Object.keys(profile.data.inventory).length > 0) {
    for (const [itemName, quantity] of Object.entries(profile.data.inventory)) {
      inventoryContainer.innerHTML += `<div class="resource-display"><span>${itemName}: </span><span id="${itemName.toLowerCase()}">${quantity}</span></div>`;
    }
  } else {
    inventoryContainer.innerHTML = "<p>Your inventory is empty.</p>";
  }
}

function renderRecentlyObtained() {
    recentlyObtainedContainer.innerHTML = "<p>No new items recently.</p>";
}

// --- EVENT LISTENERS ---
async function handleAction(event) {
  const actionId = event.currentTarget.id;
  const newState = await fetchApi("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actionId }),
  });
  if (newState) {
    gameState = newState;
    renderAll();
  }
}

["gather-wood-button", "mine-stone-button", "forage-herbs-button"].forEach(id => {
  document.getElementById(id).addEventListener("click", handleAction);
});

newProfileButton.addEventListener("click", () => {
  showInputModal("Create New Profile", "Enter a name for your new profile:", async (newName) => {
    if (newName && newName.trim() !== "") {
      const newState = await fetchApi("/api/profile/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (newState) {
        gameState = newState;
        renderAll();
      }
    }
  });
});

renameProfileButton.addEventListener("click", () => {
  const currentProfile = gameState.profiles[gameState.selectedProfileIndex];
  showInputModal("Rename Profile", `Enter a new name for "${currentProfile.name}":`, async (newName) => {
    if (newName && newName.trim() !== "") {
      const newState = await fetchApi("/api/profile/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (newState) {
        gameState = newState;
        renderAll();
      }
    }
  }, currentProfile.name);
});

deleteProfileButton.addEventListener("click", () => {
  if (gameState.profiles.length <= 1) {
    showAlert("You cannot delete the last profile.");
    return;
  }
  const currentProfile = gameState.profiles[gameState.selectedProfileIndex];
  const confirmPhrase = `delete ${currentProfile.name}`;
  showInputModal(
    "Delete Profile",
    `This action cannot be undone. To confirm, please type "${confirmPhrase}" in the box below.`,
    async (inputValue) => {
      if (inputValue === confirmPhrase) {
        const newState = await fetchApi("/api/profile/delete", { method: "DELETE" });
        if (newState) {
          gameState = newState;
          renderAll();
          showAlert(`Profile "${currentProfile.name}" has been deleted.`);
        }
      } else {
        showAlert("The text you entered did not match. Action cancelled.");
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
                    gameState = newState;
                    renderAll();
                    showAlert("All game data has been reset.");
                }
            } else {
                showAlert("The text you entered did not match. Action cancelled.");
            }
        }
    );
});

resetProfileButton.addEventListener("click", () => {
    const currentProfile = gameState.profiles[gameState.selectedProfileIndex];
    const confirmPhrase = `reset ${currentProfile.name}`;
    showInputModal(
        "Reset Profile",
        `This action cannot be undone. To confirm, please type "${confirmPhrase}" in the box below.`,
        async (inputValue) => {
            if (inputValue === confirmPhrase) {
                const newState = await fetchApi("/api/profile/reset", { method: "POST" });
                if (newState) {
                    gameState = newState;
                    renderAll();
                    showAlert(`Profile "${currentProfile.name}" has been reset.`);
                }
            } else {
                showAlert("The text you entered did not match. Action cancelled.");
            }
        }
    );
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
                showAlert("The text you entered did not match. Action cancelled.");
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

document.getElementById("profile-selector").addEventListener("click", (event) => toggleDropdown(event.currentTarget.closest(".custom-dropdown")));
document.getElementById("theme-selector").addEventListener("click", (event) => toggleDropdown(event.currentTarget.closest(".custom-dropdown")));
document.getElementById("font-selector").addEventListener("click", (event) => toggleDropdown(event.currentTarget.closest(".custom-dropdown")));


document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom-dropdown")) {
    document.querySelectorAll(".custom-dropdown-options.show").forEach((options) => {
      const dropdown = options.closest(".custom-dropdown");
      if (dropdown) {
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
    { name: "Fira Code", value: `'Fira Code', monospace` }
];
let selectedFontIndex = 0;
const fontSelector = document.getElementById("font-selector");
const fontSelectedLabel = document.getElementById("font-selected-label");
const fontOptions = document.getElementById("font-options");

function applyFont() {
    const font = fonts[selectedFontIndex].value;
    document.documentElement.style.setProperty('--font-family', font);
    localStorage.setItem("selectedFont", font);
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
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValue = document.getElementById('font-size-value');
let currentFontSize = 16;

function applyFontSize() {
    document.documentElement.style.setProperty('--font-size', `${currentFontSize}px`);
    localStorage.setItem('fontSize', currentFontSize);
}

function updateFontSizeDisplay() {
    fontSizeValue.textContent = `${currentFontSize}px`;
    fontSizeSlider.value = currentFontSize;
}

fontSizeSlider.addEventListener('input', (e) => {
    currentFontSize = e.target.value;
    updateFontSizeDisplay();
    applyFontSize();
});


// --- THEME CHANGER ---
const themes = [
  { value: "dark", name: "Dark" }, { value: "light", name: "Light" }, { value: "blue", name: "Blue" },
  { value: "dracula", name: "Dracula" }, { value: "solarized", name: "Solarized" }, { value: "matrix", name: "Matrix" },
  { value: "cyberpunk", name: "Cyberpunk" }, { value: "gruvbox", name: "Gruvbox" }, { value: "nord", name: "Nord" },
  { value: "monokai", name: "Monokai" }, { value: "tomorrow-night", name: "Tomorrow Night" },
  { value: "oceanic-next", name: "Oceanic Next" }, { value: "one-dark", name: "One Dark" },
  { value: "gothic", name: "Gothic" }, { value: "pink", name: "Pink" }
];
let selectedThemeIndex = 0;
const themeSelector = document.getElementById("theme-selector");
const themeSelectedLabel = document.getElementById("theme-selected-label");
const themeOptions = document.getElementById("theme-options");

function applyTheme() {
  const theme = themes[selectedThemeIndex].value;
  document.body.dataset.theme = theme;
  localStorage.setItem("selectedTheme", theme);
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
const modalText = document.getElementById("modal-text");
const modalConfirmButton = document.getElementById("modal-confirm-button");
const modalCancelButton = document.getElementById("modal-cancel-button");

let onConfirmCallback = null;

function showConfirmation(text, onConfirm) {
  modalText.textContent = text;
  onConfirmCallback = onConfirm;
  modalConfirmButton.textContent = "Confirm";
  modalCancelButton.style.display = "inline-block";
  confirmationModal.style.display = "flex";
}

function showAlert(text) {
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
const inputModalConfirmButton = document.getElementById("input-modal-confirm-button");
const inputModalCancelButton = document.getElementById("input-modal-cancel-button");

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
async function initialize() {
  // Theme
  const savedTheme = localStorage.getItem("selectedTheme");
  if (savedTheme) {
    const savedThemeIndex = themes.findIndex((t) => t.value === savedTheme);
    if (savedThemeIndex !== -1) selectedThemeIndex = savedThemeIndex;
  }
  renderThemeOptions();
  updateThemeDisplay();
  applyTheme();

  // Font
  const savedFont = localStorage.getItem("selectedFont");
  if (savedFont) {
      const savedFontIndex = fonts.findIndex((f) => f.value === savedFont);
      if (savedFontIndex !== -1) selectedFontIndex = savedFontIndex;
  }
  renderFontOptions();
  updateFontDisplay();
  applyFont();

  // Font Size
  const savedFontSize = localStorage.getItem('fontSize');
  if (savedFontSize) {
      currentFontSize = savedFontSize;
  }
  updateFontSizeDisplay();
  applyFontSize();

  // Game State
  const initialState = await fetchApi("/api/game-state");
  if (initialState) {
    gameState = initialState;
    renderAll();
    loadingOverlay.style.display = "none";
    mainContainer.style.display = "flex";
  } else {
    loadingOverlay.innerHTML = `<div class="loading-text">Error: Could not connect to the game server. Please try again later.</div>`;
  }
}

initialize();
