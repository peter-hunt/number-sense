# AI Notes

## User's Architectural Vision

**High-Level Goal:**

- Evolve the current project into a persistent, multi-user MMORPG-style game.

**Target Architecture:**

- **Frontend:** A static web application (HTML, CSS, JS) hosted on **Firebase Hosting**. This will be the user interface that players interact with.
- **Backend:** The core game logic will be a Python application running as a containerized service on **Google Cloud Run**.
- **Database:** Player data (profiles, skills, inventory, etc.) will be stored in a scalable, cloud-native database, likely **Google Cloud Firestore**.
- **Authentication:** Users will log in via **Firebase Authentication**, which will securely identify them to the Python backend.

**Current Development Phase:**

- **Refactor the application from a pure client-side (JavaScript-only) model to a client-server model.**
- **Goal:** Move all game state and logic into a Python backend (Flask). The JavaScript frontend will be responsible only for UI rendering and user input.
- **Methodology:**
  - The Python backend will be developed with the future Google Cloud Run architecture in mind (stateless API, decoupled data layer).
  - A local `database.json` file will be used as a temporary, placeholder database for rapid prototyping and development. This is understood to be a temporary measure that will be replaced by Firestore.
  - The API endpoints created in Python will be designed to be clear and reusable.

## Technical Implementation Details

### Frontend/Backend Interaction Model

The interaction will follow a standard REST API pattern:

1.  **User Action:** The user performs an action in the browser (e.g., clicks a button).
2.  **JS `fetch` Request:** The JavaScript frontend initiates an API call using the `fetch()` function. This request is sent to the Python backend.
3.  **Python Logic:** The Python (Flask) backend receives the request, executes the relevant game logic, and interacts with the database.
4.  **Python JSON Response:** The backend returns the result of the operation, typically the new game state, formatted as a JSON object.
5.  **JS UI Update:** The JavaScript receives the JSON response and updates the HTML to reflect the new state, providing a seamless experience for the user.

### Security and Authentication Model (Future State)

The application will be secured using Firebase Authentication and ID Tokens:

1.  **Login:** The user logs in on the frontend using a Firebase Authentication method (e.g., Google Sign-In).
2.  **ID Token:** Firebase provides the frontend with a short-lived, signed ID Token.
3.  **Authenticated API Calls:** Every `fetch` request from the frontend to the Python backend will include this ID Token in the `Authorization: Bearer <token>` header.
4.  **Backend Verification:** The Python backend will use the Firebase Admin SDK to verify the ID Token on every request. This check ensures the request is from an authenticated user and identifies _which_ user it is.
5.  **Secure Data Access:** Upon successful verification, the backend will perform database operations in the context of the verified user ID (`uid`), preventing any user from accessing or modifying another user's data.

---

# Game Design Vision & Ideas

## Crafting & Collection Philosophy (Inspired by Hypixel Skyblock)

This system moves away from traditional, static recipe books and toward a dynamic, exploration-based model.

- **Recipe Discovery through Experimentation:**

  - Players will not be given explicit recipes. Instead, they must discover them by combining materials in a crafting interface.
  - This encourages experimentation and a deep understanding of the materials and their (mathematical) properties.
  - Experimenting will consume the materials, creating a cost/risk/reward system for discovering new crafts.

- **Variable Quality Recipes:**

  - A single item might have multiple valid crafting recipes.
  - A "cheaper" recipe (fewer materials) could produce a standard-quality item.
  - A more "expensive" recipe (more or rarer materials) could produce a higher-quality version of the same item with enhanced stats. This rewards players who push the boundaries and collect more.

- **Collection as Material Mastery:**

  - The concept of "Collection" is not about unlocking recipes at set thresholds. Instead, it's about a player's familiarity and accumulated knowledge of a material.
  - Gathering materials allows for more experimentation, which in turn leads to more recipe discoveries.
  - A player's progress is defined by the breadth and depth of materials they have mastered, not by a checklist of items.

- **Skyblock-Inspired Leveling:**
  - An overarching character level system, similar to Hypixel Skyblock's, can be implemented.
  - This level would be calculated based on a player's accomplishments, such as the number of unique recipes discovered, milestones in material gathering, and the quality of items crafted. This provides a clear metric for overall game progression that is tied directly to the player's own exploration and effort.

### Refinement 1: More Detailed Combat Mechanics

To make the combat feel more distinct for each class, we can define the mechanics more concretely:

- **Algebrian (Melee):** Combat is based on quickly solving algebraic equations.

  - **Attack:** An equation like `3x - 7 = 11` appears. Solving for `x` correctly and quickly determines the damage dealt.
  - **Parry:** To block an incoming attack, you must solve an inequality, like `5y + 3 > 20`, to find the valid range for a successful parry.

- **Geometrist (Summoner):** The "rituals" for summoning are about constructing geometric shapes.

  - **Mechanic:** You are given points on a plane, and you must connect them with lines defined by equations (e.g., `y = 2x + 1`) to form a specific polygon. Completing the shape summons a creature, with more complex shapes yielding more powerful summons.

- **Grapher/Functor (Ranged):** This class attacks by defining the path of a projectile.
  - **Mechanic:** You see a target on a 2D plane with obstacles. You must input a function (e.g., a parabola `y = -0.5(x-4)^2 + 8` or a sine wave) that allows your projectile to hit the target.

### Refinement 2: Clarifying and Expanding Skills

Let's give more definition to some of the processing and collection skills.

- **Smithing (Geometry):** Let's call this **Geometric Forging**.

  - **Mechanic:** To forge an item, you are presented with its 2D or 3D blueprint. You must use geometric tools to measure angles, find midpoints, bisect lines, and inscribe shapes to successfully craft the item. Higher-tier items require more complex geometric constructions.

- **Fishing (Number Theory):**

  - **Mechanic:** Different fishing spots correspond to different number sequences. To catch a fish, you must "tune" your rod by identifying the properties of numbers that appear on screen (e.g., clicking on all prime numbers, or numbers in a Fibonacci sequence). The rarity of the fish is tied to the complexity of the number theory concept.

- **Glasswork (Set Theory):**

  - **Mechanic:** Creating potions or glass items involves combining ingredients, which are treated as "sets" with specific properties. The crafting interface is based on Venn diagrams. You combine ingredients using set operations: **Union** (mixing), **Intersection** (finding shared properties for a powerful alloy), and **Difference** (removing impurities).

- **Lumbering (Combinatorics):**
  - **Mechanic:** To maximize your wood yield from a tree, you must solve a combinatorial problem. A tree could be represented as a branching structure, and you need to find the optimal combination or permutation of cuts to get the most valuable logs.

### Refinement 3: A Tiered Mathematical Progression

To ensure the game's progression is tied to learning, we can structure the skills into tiers that follow a logical mathematical path. A player must demonstrate mastery in one tier before unlocking the next.

- **Tier 1: The Foundation (Arithmetic & Basic Geometry)**

  - **Math:** Add, Subtract, Multiply, Divide, Powers.
  - **Skills:** Foraging, Woodcutting, Farming, Mining.
  - **Gateway Quest:** A "graduation" quest that requires solving a multi-step arithmetic problem to unlock Tier 2 skills.

- **Tier 2: The Apprentice (Algebra, Geometry, Basic Number Theory)**

  - **Math:** Solving for variables, geometric shapes, primes, factors.
  - **Skills:** Crafting, Smithing, Fishing, Hunting, Melee Combat.
  - **Gateway Quest:** A quest to design and craft a complex item using algebraic and geometric principles.

- **Tier 3: The Scholar (Advanced Algebra, Logic, Early Calculus)**

  - **Math:** Functions, Optimization, Logic Gates, Derivatives.
  - **Skills:** Brewing/Cooking, Enchanting, Ranged Combat, Wiring.
  - **Gateway Quest:** A challenge to create an automated system or a powerful enchanted item that requires optimizing a function.

- **Tier 4: The Master (Calculus, Linear Algebra, Proofs)**
  - **Math:** Integrals, Matrices, Formal Proofs.
  - **Skills:** Spellcraft, Automation, Divination.
  - **Capstone Skill - Proofs:** Unlocking the ability to write a formal "proof" for a new, unique spell or item. This would be the ultimate expression of mathematical mastery in the game.

### Constructive Feedback & Design Principles

- **Principle 1: Mitigate the "Math Wall".** Player progression should not halt indefinitely if a player struggles with a specific math concept.

  - **Solution A:** "Gateway Quests" to unlock new tiers should be engaging capstone projects (e.g., designing a machine using algebra) rather than abstract tests.
  - **Solution B:** For difficult concepts, provide alternative, longer "scenic routes" that offer more scaffolding and step-by-step guidance.

- **Principle 2: Prioritize "Fun" over "Homework".** The math should feel naturally integrated into the game world, not like a separate, abstract test.
  - **Solution:** Integrate the math diegetically. For combat, instead of a pop-up equation, the enemy's properties (shield value, speed) are part of the equation that the player's actions are trying to solve. The context makes the math feel like a core part of the gameplay loop.

## The Cognitive Inventory: An Overview

Your inventory is not a physical bag; it is the active space of your character's mind. You don't store items, you memorize them. This single principle explains the entire hybrid system, splitting it into two natural types of memory that everyone understands: specific, vivid memories of unique objects, and the more abstract, fuzzy memory of a large quantity.

### Part 1: Equipment as "Eidetic Memory" (Dynamic Equipment Slots)

This is your "slot-based" inventory for equipment like swords, armor, and tools. These are unique, important items, and your mind treats them as such.

#### The Concept:

When you acquire a new piece of equipment—say, the "Axiom-Breaker Axe"—you don't put it in a scabbard. You commit its every detail to memory. You remember its weight, the specific geometric patterns etched into the haft, the precise curve of its blade, its unique resonant frequency. It becomes a permanent, vivid, "photographic" memory. This is your Eidetic Memory.

#### The Mechanics:

- Discrete Slots: Your mind has a finite number of "memory palaces" or "mental hooks" where it can hang these perfectly-recalled eidetic memories. This is your equipment slot limit. You might have 12 slots for weapons, 10 for armor, etc. Each slot holds one, and only one, perfect recollection.

- Perfect Recall: Because these memories are so strong and clear, they are permanent and stable. An item in your Eidetic Memory will never decay or be lost. You can call upon it instantly and perfectly at any time (i.e., equip it).

- Swapping and Forgetting: To equip a new item when your slots are full, you must choose to "forget" an existing one. This isn't just dropping an item; it's an intentional act of releasing that perfect memory from your mind to make space for a new one. This could be done by selling it (transferring the memory to another's mind for coin), or salvaging it (breaking down the memory into its component concepts/materials).

### Part 2: Materials as "Working Memory" (Dynamic Counter Inventory)

This is your "dictionary-based" inventory for fungible materials like ore, wood, and monster parts. You don't need to remember every single splinter of wood; you just need a general, running tally.

#### The Concept:

You don't memorize every single piece of iron ore. That would be impossible. Instead, you maintain a fluid, running tally in your Working Memory. It's a fuzzy, abstract concept: "I have a lot of iron ore," which the game UI helpfully translates into a number for you (Iron Ore: 754). This memory is less stable because it's not anchored to a single, unique object.

#### The Mechanics: "Losing the Thread"

This is where the core mechanic comes into play. Your Working Memory has a limited capacity—not a hard wall, but a threshold where it becomes overtaxed. Pushing past this threshold causes you to start "losing the thread" of your thoughts.

- The Soft Cap (Mental Fatigue): As a material count gets very high, your mind struggles to maintain the tally. This Mental Fatigue makes it harder to add more. When gathering, you might have to "refocus" (a quick mini-game or a longer cast bar) to successfully add the new items to your count. You're fighting to keep the number straight in your head.

- The Instability (Forgetting the Count): When your Working Memory for a specific material is truly overtaxed (e.g., above 90% of your limit), the memory becomes unstable.

- Passive Drain: You start to "forget the exact count." Over time, the number will slowly tick down. It’s not that the ore is physically vanishing from a bag; your character is simply unable to maintain such a precise, large number in their head, and the memory of a few pieces just... slips away.

- Crafting Fumbles: This is the most critical part. When you try to craft using a material where the count is unstable, you are pulling from a fuzzy, indistinct memory. This can cause you to "lose your place" in the crafting process. You might grab a "handful" instead of a precise amount, leading to:

- Wasteful Crafting: The craft succeeds, but consumes 10-20% more of the unstable material than the recipe required because you weren't focused.

- Flawed Results: The imprecise measurement throws off the entire craft, resulting in a lower-quality item. You were sure you had the recipe right, but your taxed mind made a mistake.

### Sensory Memory: The "Afterimage" of an Item (Dynamic Loot Window)

Sensory memory is the shortest-term element of memory, acting as a buffer for stimuli received through the senses. It lasts for a fraction of a second (iconic memory for visuals) to a few seconds (echoic memory for sounds). In your system, this can represent items that are perceived but not yet memorized.

- The Mechanics: "The Glimpse"
  Temporary Loot Window: When you defeat an enemy or open a chest, the loot doesn't go into any inventory. Instead, a "Glimpse" window appears, showing the items as fleeting sensory afterimages. You have a very short window (e.g., 5-10 seconds) to decide what to do with them.

- Committing to Memory: From this Glimpse, you have two choices:

- - Commit to Eidetic Memory: If it's a unique piece of equipment, you can perform a "Focus" action (a quick button press or short cast) to study its details and move it into one of your permanent equipment slots. This is the act of paying attention to a sensory input and encoding it into short-term (and then long-term) memory.

- - Add to Working Memory Tally: If it's a material, you can "Acknowledge" it, which adds its count to your fuzzy Working Memory tally.

- Fading Away: If you fail to act within the time limit, the Glimpse fades. The items are gone—not because they physically vanished, but because your character was distracted and the fleeting sensory memory was overwritten before it could be encoded. This creates a sense of urgency and rewards attentive gameplay.

### Episodic Memory: The "History" of an Item (Dynamic Item Provenance)

Episodic memory is the memory of autobiographical events (times, places, associated emotions). It’s the story of "what happened." In your system, this isn't about storing the item itself, but storing the experiences associated with an item in your Eidetic Memory.

The Mechanics: "Item Provenance"

- Attaching Experiences: An item in your Eidetic Memory isn't just a static object; it's linked to the moments it was used. The "Axiom-Breaker Axe" isn't just an axe; it's the axe you used to slay the Crimson Lich, the axe that nearly shattered against the Iron Golem, and the axe you were holding when you discovered the Sunken City.

- Evolving Properties: This "Provenance" can have tangible effects.

- - Affinity: The more you use a weapon against a certain type of enemy (e.g., Undead), the stronger your episodic memory of its effectiveness becomes. This could translate into a small, stacking damage bonus against that enemy type. You remember how to wield it perfectly in those situations.

- - - This could be used to reflect the initially hidden chemistry that weapons with specific materials are more effective against certain enemies. For example, a weapon made of silver might be more effective against werewolves than other enemies, but this is only revealed through the player's experience and episodic memory of using that weapon against werewolves.

- - Emotional Resonance: If an item was used in a moment of great triumph, it could gain a "Hallowed" or "Storied" tag, perhaps glowing faintly or providing a minor buff to your character's resolve (e.g., resistance to fear effects). Conversely, an item used in a moment of great failure or trauma (e.g., the armor you wore when a companion fell) might acquire a "Haunted" or "Sorrowful" property, which could be a purely narrative detail or a minor statistical drawback.

- Transferring History: When you sell or trade the item, you could be selling its "story" as well, making it more valuable to collectors or historians.

### Semantic Memory: The "Blueprint" in Your Mind (Dynamic Crafting System)

Semantic memory is your repository of general world knowledge, facts, ideas, and concepts. It's not tied to personal experience. This is your character's knowledge of how things work, separate from the items themselves.

The Mechanics: "The Internal Recipe Book"

- Learned, Not Held: Crafting recipes are not physical scrolls that take up inventory space. When you learn a recipe, that knowledge is committed to your Semantic Memory. It becomes a permanent, known fact.

- The "Library of Concepts": This is a separate UI from your inventory, representing your character's knowledge base. It would contain tabs for:

- - Crafting Recipes: Knowledge of how to combine materials.

- - Bestiary: Facts learned about monsters (e.g., "Trolls are vulnerable to fire"). Successfully identifying a weakness commits it to your Bestiary.

- - Alchemy Formulas: Knowledge of potion effects and reagent properties.

- Memory and Crafting: This links directly to your Working Memory mechanic. You may have the recipe perfectly memorized (Semantic Memory), but if your Working Memory for the materials is overtaxed and "fuzzy," you can still fumble the execution. This creates a compelling dynamic between knowing what to do and being mentally capable of doing it.

- Forgetting a Recipe: A truly traumatic event (e.g., a special boss attack that targets the mind) could cause you to "forget" a recipe, forcing you to relearn it, representing a form of cognitive trauma.

### Procedural Memory: The "Muscle Memory" of Skills (Dynamic Skill System)

Procedural memory is the unconscious memory for skills and habits, often called "muscle memory." It's how you remember to ride a bike, swing a sword, or parry an attack without conscious thought. This memory type shouldn't govern items but rather how your character uses them.

The Mechanics: "Mastery and Habits"

- Skill Fluency: Procedural memory represents your character's practiced skills. It doesn't take up inventory slots because it's encoded in the character's very being. This could be represented by a "Mastery" or "Fluency" level with certain weapon types or crafting stations.

- Efficient Actions: The more you perform an action, the more ingrained it becomes.

- - Crafting: High procedural memory for Blacksmithing could reduce the chance of "Crafting Fumbles" even when your Working Memory is taxed. Your hands know the motions so well they can compensate for your mental distraction. It might also speed up the crafting process itself.

- - Combat: Your "memory" of a specific sword combo allows you to execute it faster and with less stamina cost. You aren't thinking about the button presses; you are simply doing it.

- Decay Through Disuse: Unlike the "permanent" eidetic memories of items, procedural memories can slowly decay if not practiced. If you haven't used a bow in a very long time, your fluency might drop slightly, increasing arrow spread or draw time until you practice a bit to "shake off the rust." This encourages players to stick with preferred playstyles or actively train to maintain versatility.
