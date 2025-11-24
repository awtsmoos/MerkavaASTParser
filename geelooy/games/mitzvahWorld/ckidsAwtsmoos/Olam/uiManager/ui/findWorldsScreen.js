//B"H

const FEATURED_ALIASES = ["awtsmoos"]; // You can add more hardcoded ones here

export default {
    shaym: "find worlds",
    className: "findWorlds hidden menu",
    children: [
        {
            tag: "style",
            innerHTML: /*css*/`
                .findWorlds {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #1a0b2e 0%, #474FFF 100%);
                    overflow-y: auto;
                    color: white;
                    font-family: 'Fredoka', sans-serif;
                }

                .fw-header {
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    background: rgba(0,0,0,0.3);
                    backdrop-filter: blur(10px);
                    border-bottom: 2px solid #FFD700;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .fw-back-btn {
                    background: #ff4757;
                    color: white;
                    border: 2px solid #fff;
                    border-radius: 50px;
                    padding: 8px 20px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                    margin-right: 20px;
                }
                .fw-back-btn:hover { transform: scale(1.05); }

                .fw-title {
                    font-family: 'Fredoka One', cursive;
                    font-size: 32px;
                    color: #FFD700;
                    text-shadow: 2px 2px 0px #000;
                    flex-grow: 1;
                }

                /* Search Section */
                .fw-search-container {
                    display: flex;
                    padding: 20px;
                    justify-content: center;
                    gap: 10px;
                }

                .fw-input {
                    padding: 15px 25px;
                    border-radius: 50px;
                    border: 2px solid #474FFF;
                    background: rgba(255,255,255,0.9);
                    font-size: 18px;
                    width: 300px;
                    font-family: 'Fredoka', sans-serif;
                    outline: none;
                    transition: width 0.3s;
                }
                .fw-input:focus { width: 400px; border-color: #FFD700; }

                .fw-search-btn {
                    padding: 12px 30px;
                    border-radius: 50px;
                    background: #474FFF;
                    color: white;
                    font-weight: bold;
                    border: 2px solid #FFD700;
                    cursor: pointer;
                    font-size: 18px;
                    box-shadow: 0 4px 0 #23144F;
                    transition: all 0.1s;
                }
                .fw-search-btn:active { transform: translateY(4px); box-shadow: 0 0 0 #23144F; }

                /* Sections */
                .fw-content {
                    padding: 20px 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                    
		    margin-top: 150px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .fw-section {
                    background: rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 25px;
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .fw-section-title {
                    font-size: 24px;
                    color: #FFD700;
                    margin-bottom: 20px;
                    font-weight: bold;
                    border-bottom: 1px solid rgba(255,215,0,0.3);
                    padding-bottom: 10px;
                    display: inline-block;
                }

                .fw-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                }

                /* Cards */
                .fw-card {
                    background: rgba(0,0,0,0.4);
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .fw-card:hover {
                    transform: translateY(-5px);
                    border-color: #FFD700;
                    background: rgba(71, 79, 255, 0.4);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                }

                .fw-card-icon {
                    font-size: 40px;
                    margin-bottom: 10px;
                }

                .fw-card-title {
                    font-weight: bold;
                    font-size: 18px;
                    word-break: break-word;
                }
                
                .fw-card-sub {
                    font-size: 12px;
                    opacity: 0.7;
                    margin-top: 5px;
                }

                /* Loading / Empty States */
                .fw-message {
                    text-align: center;
                    font-size: 20px;
                    padding: 40px;
                    color: #aaa;
                }

                .hidden { display: none !important; }
            `
        },
        // --- HEADER ---
        {
            className: "fw-header",
            children: [
                {
                    tag: "button",
                    className: "fw-back-btn",
                    textContent: "⬅ Back",
                    onclick(e, $, ui) {
                        // Logic: If in "Results View", go back to "Dashboard".
                        // If in "Dashboard", go back to "Main Menu".
                        const dashboard = $("fw-dashboard");
                        const results = $("fw-results");
                        
                        if (!results.classList.contains("hidden")) {
                            // Go back to dashboard
                            results.classList.add("hidden");
                            dashboard.classList.remove("hidden");
                            $("fw-results-grid").innerHTML = ""; // Clear results
                            $("fw-results-title").textContent = "Results";
                        } else {
                            // Go back to main menu
                            $("main menu").classList.remove("hidden");
                            $("find worlds").classList.add("hidden");
                        }
                    }
                },
                { className: "fw-title", textContent: "World Browser" }
            ]
        },

        // --- MAIN CONTENT WRAPPER ---
        {
            className: "fw-content",
            children: [
                
                // --- SEARCH BAR ---
                {
                    className: "fw-search-container",
                    children: [
                        {
                            tag: "input",
                            shaym: "fw-search-input",
                            className: "fw-input",
                            placeholder: "Enter Alias to search..."
                        },
                        {
                            tag: "button",
                            className: "fw-search-btn",
                            textContent: "Search",
                            onclick(e, $, ui) {
                                const alias = $("fw-search-input").value;
                                if(alias) {
                                    ui.peula($("find worlds"), { loadAliasWorlds: { alias, title: `Search: ${alias}` } });
                                }
                            }
                        }
                    ]
                },

                // --- DASHBOARD VIEW (Featured + My Levels) ---
                {
                    shaym: "fw-dashboard",
                    children: [
                        
                        // FEATURED SECTION
                        {
                            className: "fw-section",
                            children: [
                                { className: "fw-section-title", textContent: "🌟 Featured Creators" },
                                {
                                    className: "fw-grid",
                                    ready(el, $, ui) {
                                        // Populate featured creators
                                        FEATURED_ALIASES.forEach(alias => {
                                            ui.html({
                                                parent: el,
                                                className: "fw-card",
                                                onclick: () => {
                                                     ui.peula($("find worlds"), { loadAliasWorlds: { alias, title: `Featured: ${alias}` } });
                                                },
                                                children: [
                                                    { className: "fw-card-icon", textContent: "👑" },
                                                    { className: "fw-card-title", textContent: alias },
                                                    { className: "fw-card-sub", textContent: "Official Content" }
                                                ]
                                            });
                                        });
                                    }
                                }
                            ]
                        },

                        // MY LEVELS SECTION
                        {
                            className: "fw-section",
                            children: [
                                { className: "fw-section-title", textContent: "🏠 My Levels" },
                                {
                                    className: "fw-grid",
                                    shaym: "fw-my-levels-grid",
                                    ready(el, $, ui) {
                                        // Check if user is logged in (has an alias)
                                        const myAlias = window.curAlias; 
                                        
                                        if (myAlias) {
                                            ui.html({
                                                parent: el,
                                                className: "fw-card",
                                                style: { background: "rgba(71, 79, 255, 0.2)", borderColor: "#474FFF" },
                                                onclick: () => {
                                                     ui.peula($("find worlds"), { loadAliasWorlds: { alias: myAlias, title: "My Personal Worlds" } });
                                                },
                                                children: [
                                                    { className: "fw-card-icon", textContent: "📂" },
                                                    { className: "fw-card-title", textContent: "Browse My Files" },
                                                    { className: "fw-card-sub", textContent: myAlias }
                                                ]
                                            });
                                        } else {
                                            el.innerHTML = "<div style='grid-column: 1/-1; color: #aaa;'>Please log in to see your levels.</div>";
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                },

                // --- RESULTS VIEW (Hidden by default) ---
                {
                    shaym: "fw-results",
                    className: "hidden",
                    children: [
                         { className: "fw-section-title", shaym: "fw-results-title", textContent: "Levels" },
                         { className: "fw-grid", shaym: "fw-results-grid" },
                         { className: "fw-message hidden", shaym: "fw-loading-msg", textContent: "Loading worlds..." },
                         { className: "fw-message hidden", shaym: "fw-empty-msg", textContent: "No worlds found." }
                    ]
                }
            ]
        }
    ],
    
    // --- LOGIC ---
    on: {
        /**
         * Reusable function to fetch worlds for ANY alias and display them in the results grid.
         */
        async loadAliasWorlds(e, $, ui) {
            const { alias, title } = e.detail;
            
            // 1. UI State Management
            $("fw-dashboard").classList.add("hidden");
            $("fw-results").classList.remove("hidden");
            $("fw-results-title").textContent = title;
            
            const grid = $("fw-results-grid");
            grid.innerHTML = ""; // Clear previous
            
            const loading = $("fw-loading-msg");
            const empty = $("fw-empty-msg");
            loading.classList.remove("hidden");
            empty.classList.add("hidden");

            try {
                // 2. Fetch Data
                // Note: path is "desktop.folder/game data.folder/worlds.folder" based on your previous code
                const response = await fetch(
                    `/api/social/aliases/${alias}/fileSystem/readFolder?${
                        new URLSearchParams({
                            path: `desktop.folder/game data.folder/worlds.folder`
                        })
                    }`
                );
                
                const worlds = await response.json();
                loading.classList.add("hidden");

                // 3. Process Results
                if (Array.isArray(worlds) && worlds.length > 0) {
                    // Filter for .js files
                    const validWorlds = worlds.filter(w => w.endsWith(".js"));

                    if (validWorlds.length === 0) {
                        empty.textContent = "No .js world files found in this folder.";
                        empty.classList.remove("hidden");
                        return;
                    }

                    // 4. Render Cards
                    validWorlds.forEach(filename => {
                        const worldName = filename.replace(".js", ""); // Strip extension for display
                        
                        ui.html({
                            parent: grid,
                            className: "fw-card",
                            onclick: async () => {
                                // --- LOAD WORLD LOGIC ---
                                try {
                                    const fileRes = await fetch(
                                        `/api/social/aliases/${alias}/fileSystem/readFile?${
                                            new URLSearchParams({
                                                path: `desktop.folder/game data.folder/worlds.folder/${filename}`
                                            })   
                                        }`
                                    );
                                    const worldCode = await fileRes.text();
                                    
                                    // Create Blob URL
                                    const blobUrl = URL.createObjectURL(
                                        new Blob([worldCode], { type: "application/javascript" })
                                    );
                                    
                                    // Launch Game
                                    const ikar = $("ikar");
                                    const mm = $("main menu");
                                    
                                    if(ikar && mm) {
                                        ikar.dispatchEvent(
                                            new CustomEvent("start", {
                                                detail: {
                                                    worldDayuhURL: blobUrl,
                                                    gameUiHTML: mm.gameUiHTML
                                                }
                                            })
                                        );
                                        
                                        // Transition UI
                                        $("find worlds").classList.add("hidden");
                                        const ld = $("loading");
                                        if(ld) ld.classList.remove("hidden");
                                        
                                        mm.classList.add("hidden");
                                        mm.isGoing = false;
                                    }
                                } catch(err) {
                                    console.error(err);
                                    alert("Error loading world file.");
                                }
                            },
                            children: [
                                { className: "fw-card-icon", textContent: "🌍" }, // Generic world icon
                                { className: "fw-card-title", textContent: worldName },
                                { className: "fw-card-sub", textContent: "Click to Play" }
                            ]
                        });
                    });

                } else {
                    empty.textContent = "No worlds found for this alias.";
                    empty.classList.remove("hidden");
                }

            } catch (err) {
                console.error(err);
                loading.classList.add("hidden");
                empty.textContent = "Error fetching worlds. User might not exist or folder is private.";
                empty.classList.remove("hidden");
            }
        }
    }
}