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
4.  **Backend Verification:** The Python backend will use the Firebase Admin SDK to verify the ID Token on every request. This check ensures the request is from an authenticated user and identifies *which* user it is.
5.  **Secure Data Access:** Upon successful verification, the backend will perform database operations in the context of the verified user ID (`uid`), preventing any user from accessing or modifying another user's data.

---

# Game Design Vision & Ideas

## Crafting & Collection Philosophy (Inspired by Hypixel Skyblock)

This system moves away from traditional, static recipe books and toward a dynamic, exploration-based model.

*   **Recipe Discovery through Experimentation:**
    *   Players will not be given explicit recipes. Instead, they must discover them by combining materials in a crafting interface.
    *   This encourages experimentation and a deep understanding of the materials and their (mathematical) properties.
    *   Experimenting will consume the materials, creating a cost/risk/reward system for discovering new crafts.

*   **Variable Quality Recipes:**
    *   A single item might have multiple valid crafting recipes.
    *   A "cheaper" recipe (fewer materials) could produce a standard-quality item.
    *   A more "expensive" recipe (more or rarer materials) could produce a higher-quality version of the same item with enhanced stats. This rewards players who push the boundaries and collect more.

*   **Collection as Material Mastery:**
    *   The concept of "Collection" is not about unlocking recipes at set thresholds. Instead, it's about a player's familiarity and accumulated knowledge of a material.
    *   Gathering materials allows for more experimentation, which in turn leads to more recipe discoveries.
    *   A player's progress is defined by the breadth and depth of materials they have mastered, not by a checklist of items.

*   **Skyblock-Inspired Leveling:**
    *   An overarching character level system, similar to Hypixel Skyblock's, can be implemented.
    *   This level would be calculated based on a player's accomplishments, such as the number of unique recipes discovered, milestones in material gathering, and the quality of items crafted. This provides a clear metric for overall game progression that is tied directly to the player's own exploration and effort.

## Refinement 1: More Detailed Combat Mechanics

To make the combat feel more distinct for each class, we can define the mechanics more concretely:

*   **Algebrian (Melee):** Combat is based on quickly solving algebraic equations.
    *   **Attack:** An equation like `3x - 7 = 11` appears. Solving for `x` correctly and quickly determines the damage dealt.
    *   **Parry:** To block an incoming attack, you must solve an inequality, like `5y + 3 > 20`, to find the valid range for a successful parry.

*   **Geometrist (Summoner):** The "rituals" for summoning are about constructing geometric shapes.
    *   **Mechanic:** You are given points on a plane, and you must connect them with lines defined by equations (e.g., `y = 2x + 1`) to form a specific polygon. Completing the shape summons a creature, with more complex shapes yielding more powerful summons.

*   **Grapher/Functor (Ranged):** This class attacks by defining the path of a projectile.
    *   **Mechanic:** You see a target on a 2D plane with obstacles. You must input a function (e.g., a parabola `y = -0.5(x-4)^2 + 8` or a sine wave) that allows your projectile to hit the target.

## Refinement 2: Clarifying and Expanding Skills

Let's give more definition to some of the processing and collection skills.

*   **Smithing (Geometry):** Let's call this **Geometric Forging**.
    *   **Mechanic:** To forge an item, you are presented with its 2D or 3D blueprint. You must use geometric tools to measure angles, find midpoints, bisect lines, and inscribe shapes to successfully craft the item. Higher-tier items require more complex geometric constructions.

*   **Fishing (Number Theory):**
    *   **Mechanic:** Different fishing spots correspond to different number sequences. To catch a fish, you must "tune" your rod by identifying the properties of numbers that appear on screen (e.g., clicking on all prime numbers, or numbers in a Fibonacci sequence). The rarity of the fish is tied to the complexity of the number theory concept.

*   **Glasswork (Set Theory):**
    *   **Mechanic:** Creating potions or glass items involves combining ingredients, which are treated as "sets" with specific properties. The crafting interface is based on Venn diagrams. You combine ingredients using set operations: **Union** (mixing), **Intersection** (finding shared properties for a powerful alloy), and **Difference** (removing impurities).

*   **Lumbering (Combinatorics):**
    *   **Mechanic:** To maximize your wood yield from a tree, you must solve a combinatorial problem. A tree could be represented as a branching structure, and you need to find the optimal combination or permutation of cuts to get the most valuable logs.

## Refinement 3: A Tiered Mathematical Progression

To ensure the game's progression is tied to learning, we can structure the skills into tiers that follow a logical mathematical path. A player must demonstrate mastery in one tier before unlocking the next.

*   **Tier 1: The Foundation (Arithmetic & Basic Geometry)**
    *   **Math:** Add, Subtract, Multiply, Divide, Powers.
    *   **Skills:** Foraging, Woodcutting, Farming, Mining.
    *   **Gateway Quest:** A "graduation" quest that requires solving a multi-step arithmetic problem to unlock Tier 2 skills.

*   **Tier 2: The Apprentice (Algebra, Geometry, Basic Number Theory)**
    *   **Math:** Solving for variables, geometric shapes, primes, factors.
    *   **Skills:** Crafting, Smithing, Fishing, Hunting, Melee Combat.
    *   **Gateway Quest:** A quest to design and craft a complex item using algebraic and geometric principles.

*   **Tier 3: The Scholar (Advanced Algebra, Logic, Early Calculus)**
    *   **Math:** Functions, Optimization, Logic Gates, Derivatives.
    *   **Skills:** Brewing/Cooking, Enchanting, Ranged Combat, Wiring.
    *   **Gateway Quest:** A challenge to create an automated system or a powerful enchanted item that requires optimizing a function.

*   **Tier 4: The Master (Calculus, Linear Algebra, Proofs)**
    *   **Math:** Integrals, Matrices, Formal Proofs.
    *   **Skills:** Spellcraft, Automation, Divination.
    *   **Capstone Skill - Proofs:** Unlocking the ability to write a formal "proof" for a new, unique spell or item. This would be the ultimate expression of mathematical mastery in the game.

## Constructive Feedback & Design Principles

*   **Principle 1: Mitigate the "Math Wall".** Player progression should not halt indefinitely if a player struggles with a specific math concept.
    *   **Solution A:** "Gateway Quests" to unlock new tiers should be engaging capstone projects (e.g., designing a machine using algebra) rather than abstract tests.
    *   **Solution B:** For difficult concepts, provide alternative, longer "scenic routes" that offer more scaffolding and step-by-step guidance.

*   **Principle 2: Prioritize "Fun" over "Homework".** The math should feel naturally integrated into the game world, not like a separate, abstract test.
    *   **Solution:** Integrate the math diegetically. For combat, instead of a pop-up equation, the enemy's properties (shield value, speed) are part of the equation that the player's actions are trying to solve. The context makes the math feel like a core part of the gameplay loop.
