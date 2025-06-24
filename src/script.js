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

// --- DATA & STATE MANAGEMENT ---

const ALL_SKILLS = ["Woodcutting", "Mining", "Foraging"];

// Default profiles for first-time users
function getDefaultProfiles() {
    return [
      {
        name: "Adventurer",
        totalLevel: 18,
        data: {
          skills: {
            "Woodcutting": { level: 5, currentXP: 1250, xpToNextLevel: 5000 },
            "Mining": { level: 10, currentXP: 800000, xpToNextLevel: 1200000 },
            "Foraging": { level: 3, currentXP: 100, xpToNextLevel: 1000 },
          }
        }
      },
    ];
}

let profiles = getDefaultProfiles();
let selectedProfileIndex = 0;


// Safely migrates profile data to include new structures
function migrateProfiles() {
  profiles.forEach(profile => {
    if (!profile.data) {
      profile.data = {};
    }
    if (!profile.data.skills) {
      profile.data.skills = {};
    }
    ALL_SKILLS.forEach(skillName => {
      if (!profile.data.skills[skillName]) {
        profile.data.skills[skillName] = { level: 1, currentXP: 0, xpToNextLevel: 100 };
      }
    });
  });
}

function loadProfiles() {
  const savedProfiles = localStorage.getItem("webGameIdleProfiles");
  const savedSelectedIndex = localStorage.getItem(
    "webGameIdleSelectedProfile"
  );
  if (savedProfiles) {
    profiles = JSON.parse(savedProfiles);
    if (savedSelectedIndex) {
      selectedProfileIndex = parseInt(savedSelectedIndex, 10);
    }
  } else {
      profiles = getDefaultProfiles();
  }
  // After loading, ensure data structure is up to date
  migrateProfiles();
}

// --- DOM ELEMENTS ---
const profileSelector = document.getElementById("profile-selector");
const profileSelectedLabel = document.getElementById(
  "profile-selected-label"
);
const profileOptions = document.getElementById("profile-options");
const homeProfileName = document.getElementById("home-profile-name");
const currentProfileName = document.getElementById(
  "current-profile-name"
);
const newProfileButton = document.getElementById("new-profile-button");
const renameProfileButton = document.getElementById(
  "rename-profile-button"
);
const deleteProfileButton = document.getElementById(
  "delete-profile-button"
);
const saveProfileButton = document.getElementById("save-profile-button");
const hardResetButton = document.getElementById("hard-reset-button");

// --- RENDER FUNCTIONS ---

function updateProfileDisplay() {
  const profile = profiles[selectedProfileIndex];
  profileSelectedLabel.innerHTML = `<span>${profile.name}</span><span class="profile-info">Lvl: ${profile.totalLevel}</span>`;
  homeProfileName.textContent = profile.name;
  currentProfileName.textContent = profile.name;
  renderProfileOptions();
  renderSkills();
}

function renderProfileOptions() {
  profileOptions.innerHTML = "";
  profiles.forEach((profile, index) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.dataset.index = index;
    item.innerHTML = `<span>${profile.name}</span> <span class="profile-info">Lvl: ${profile.totalLevel}</span>`;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedProfileIndex = index;
      updateProfileDisplay();
      toggleDropdown(e.currentTarget.closest(".custom-dropdown"));
    });
    profileOptions.appendChild(item);
  });
}

function formatNumber(num) {
    if (num < 1000) {
        return num;
    }
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(2);
    return shortNum + suffixes[i];
}

function renderSkills() {
    const skillsContainer = document.getElementById('skills-container');
    skillsContainer.innerHTML = '';
    const profile = profiles[selectedProfileIndex];
    if (profile && profile.data && profile.data.skills) {
        const skills = profile.data.skills;
        for (const skillName in skills) {
            const skill = skills[skillName];
            const percentage = (skill.xpToNextLevel > 0) ? (skill.currentXP / skill.xpToNextLevel) * 100 : 0;
            const skillHTML = `
                <div class="skill">
                    <div class="skill-name">
                        <span>${skillName}</span>
                        <span>Level: ${skill.level}</span>
                    </div>
                    <div class="skill-bar-container">
                        <div class="skill-bar" style="width: ${percentage}%;"></div>
                        <div class="skill-text">
                            ${formatNumber(skill.currentXP)} / ${formatNumber(skill.xpToNextLevel)}
                        </div>
                    </div>
                </div>
            `;
            skillsContainer.innerHTML += skillHTML;
        }
    }
}

// --- EVENT LISTENERS ---

newProfileButton.addEventListener("click", () => {
  const newName = prompt("Enter new profile name:");
  if (newName && newName.trim() !== "") {
    const newProfile = {
      name: newName.trim(),
      totalLevel: 1,
      data: { skills: {} }
    };
    ALL_SKILLS.forEach(skillName => {
        newProfile.data.skills[skillName] = { level: 1, currentXP: 0, xpToNextLevel: 100 };
    });
    profiles.push(newProfile);
    selectedProfileIndex = profiles.length - 1;
    updateProfileDisplay();
  }
});

renameProfileButton.addEventListener("click", () => {
  const newName = prompt(
    `Enter new name for "${profiles[selectedProfileIndex].name}":`
  );
  if (newName && newName.trim() !== "") {
    profiles[selectedProfileIndex].name = newName.trim();
    updateProfileDisplay();
  }
});

deleteProfileButton.addEventListener("click", () => {
  if (profiles.length > 1) {
    showConfirmation("Are you sure you want to delete this profile?", () => {
      profiles.splice(selectedProfileIndex, 1);
      if (selectedProfileIndex >= profiles.length) {
        selectedProfileIndex = profiles.length - 1;
      }
      updateProfileDisplay();
    });
  } else {
    alert("You cannot delete the last profile.");
  }
});

saveProfileButton.addEventListener("click", () => {
  localStorage.setItem("webGameIdleProfiles", JSON.stringify(profiles));
  localStorage.setItem(
    "webGameIdleSelectedProfile",
    selectedProfileIndex
  );
  alert("Profile saved!");
});

hardResetButton.addEventListener("click", () => {
  showConfirmation(
    "Are you sure you want to hard reset? This will delete all your profiles and cannot be undone.",
    () => {
      localStorage.clear();
      location.reload();
    }
  );
});

function toggleDropdown(dropdownElement) {
  if (!dropdownElement) return;
  const options = dropdownElement.querySelector(
    ".custom-dropdown-options"
  );
  const arrow = dropdownElement.querySelector(".dropdown-arrow");
  options.classList.toggle("show");
  arrow.classList.toggle("open");
}

document
  .getElementById("profile-selector")
  .addEventListener("click", (event) => {
    toggleDropdown(event.currentTarget.closest(".custom-dropdown"));
  });

document
  .getElementById("theme-selector")
  .addEventListener("click", (event) => {
    toggleDropdown(event.currentTarget.closest(".custom-dropdown"));
  });

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom-dropdown")) {
    document
      .querySelectorAll(".custom-dropdown-options.show")
      .forEach((options) => {
        const dropdown = options.closest(".custom-dropdown");
        if (dropdown) {
          const arrow = dropdown.querySelector(".dropdown-arrow");
          options.classList.remove("show");
          if (arrow) arrow.classList.remove("open");
        }
      });
  }
});


// --- THEME CHANGER ---
const themes = [
    { value: 'dark', name: 'Dark' },
    { value: 'light', name: 'Light' },
    { value: 'blue', name: 'Blue' },
    { value: 'dracula', name: 'Dracula' },
    { value: 'solarized', name: 'Solarized' },
    { value: 'matrix', name: 'Matrix' },
    { value: 'cyberpunk', name: 'Cyberpunk' },
    { value: 'gruvbox', name: 'Gruvbox' },
    { value: 'nord', name: 'Nord' },
    { value: 'monokai', name: 'Monokai' },
    { value: 'tomorrow-night', name: 'Tomorrow Night' },
    { value: 'oceanic-next', name: 'Oceanic Next' },
    { value: 'one-dark', name: 'One Dark' },
];
let selectedThemeIndex = 0;
const themeSelector = document.getElementById("theme-selector");
const themeSelectedLabel = document.getElementById(
  "theme-selected-label"
);
const themeOptions = document.getElementById("theme-options");

function applyTheme() {
    const theme = themes[selectedThemeIndex].value;
    document.body.dataset.theme = theme;
    localStorage.setItem('selectedTheme', theme);
}

function updateThemeDisplay() {
  const theme = themes[selectedThemeIndex];
  themeSelectedLabel.innerHTML = `<span>${theme.name}</span>`;
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

// --- CONFIRMATION MODAL ---
const confirmationModal = document.getElementById('confirmation-modal');
const modalText = document.getElementById('modal-text');
const modalConfirmButton = document.getElementById('modal-confirm-button');
const modalCancelButton = document.getElementById('modal-cancel-button');

function showConfirmation(text, onConfirm) {
    modalText.textContent = text;
    confirmationModal.style.display = 'flex';

    modalConfirmButton.onclick = () => {
        onConfirm();
        confirmationModal.style.display = 'none';
    };

    modalCancelButton.onclick = () => {
        confirmationModal.style.display = 'none';
    };
}

// --- INITIAL LOAD ---
loadProfiles();
updateProfileDisplay();

const savedTheme = localStorage.getItem('selectedTheme');
if (savedTheme) {
    const savedThemeIndex = themes.findIndex(t => t.value === savedTheme);
    if (savedThemeIndex !== -1) {
        selectedThemeIndex = savedThemeIndex;
    }
}

renderThemeOptions();
updateThemeDisplay();
applyTheme();
