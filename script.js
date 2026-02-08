/* =======================
   script.js - Les Affaires (Version Import Update)
   ======================= */

// ID de ton Google Sheet
const SHEET_ID = '1ItsJGNJL9pW-G-edu5E617jvzVa-6nmmD6Pd8ctHwVk';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Variables globales
let allVehicles = [];
let currentContainerId = ''; // Pour savoir où afficher les résultats de recherche

// Variables Lightbox Swipe
let currentImageIndex = 0;
let lightboxImages = [];
let startX = 0;
let endX = 0;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Activation de la recherche (compatible import et occasion)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterVehicles(e.target.value));
    }
    
    initSite();
});

async function initSite() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const vehicles = csvToObjects(data);
        
        allVehicles = vehicles; // Sauvegarde globale
        
        // DÉTECTION DE LA PAGE ET DU CONTENEUR
        const homeContainer = document.getElementById('home-stock-container');
        const occasionContainer = document.getElementById('all-stock-container');
        const importContainer = document.getElementById('import-stock-container');

        if (homeContainer) {
            // PAGE ACCUEIL : Seulement ALAUNE = Oui
            currentContainerId = 'home-stock-container';
            const featured = vehicles.filter(v => v.ALAUNE && v.ALAUNE.toLowerCase() === 'oui');
            renderVehicles(featured, currentContainerId);
            
        } else if (importContainer) {
            // PAGE IMPORT : Seulement si Statut contient "import" ou "commande" ou "sur commande"
            currentContainerId = 'import-stock-container';
            const imports = vehicles.filter(v => 
                v.Statut && (
                    v.Statut.toLowerCase().includes('import') || 
                    v.Statut.toLowerCase().includes('commande') ||
                    v.Statut.toLowerCase().includes('sur commande') ||
                    v.Statut.toLowerCase().includes('importation')
                )
            );
            renderVehicles(imports, currentContainerId);
            
            // Configurer la recherche spécifique à l'import
            const searchImportInput = document.getElementById('searchImportInput');
            const searchImportListInput = document.getElementById('searchImportListInput');
            
            if (searchImportInput) {
                searchImportInput.addEventListener('input', (e) => filterImportVehicles(e.target.value));
            }
            if (searchImportListInput) {
                searchImportListInput.addEventListener('input', (e) => filterImportVehicles(e.target.value));
            }

        } else if (occasionContainer) {
            // PAGE OCCASION : Tout ce qui n'est PAS import
            currentContainerId = 'all-stock-container';
            const stock = vehicles.filter(v => 
                !v.Statut || (
                    !v.Statut.toLowerCase().includes('import') && 
                    !v.Statut.toLowerCase().includes('commande') &&
                    !v.Statut.toLowerCase().includes('sur commande')
                )
            );
            renderVehicles(stock, currentContainerId);
        }

    } catch (error) {
        console.error("Erreur:", error);
    }
}

// Ajouter cette nouvelle fonction pour filtrer les véhicules d'import
function filterImportVehicles(query) {
    const lowerQuery = query.toLowerCase();
    const isImportPage = document.getElementById('import-stock-container');
    
    if (!isImportPage) return;
    
    // Filtrer depuis la liste globale "allVehicles"
    const filtered = allVehicles.filter(v => {
        // 1. Doit être un véhicule d'import
        const isImport = v.Statut && (
            v.Statut.toLowerCase().includes('import') || 
            v.Statut.toLowerCase().includes('commande') ||
            v.Statut.toLowerCase().includes('sur commande') ||
            v.Statut.toLowerCase().includes('importation')
        );
        
        // 2. Correspondance texte
        const matchesText = 
            (v.Nom && v.Nom.toLowerCase().includes(lowerQuery)) || 
            (v.Description && v.Description.toLowerCase().includes(lowerQuery)) ||
            (v.Annee && v.Annee.includes(lowerQuery)) ||
            (v.Prix && v.Prix.toLowerCase().includes(lowerQuery)) ||
            (v.Energie && v.Energie.toLowerCase().includes(lowerQuery));
            
        return matchesText && isImport;
    });

    renderVehicles(filtered, currentContainerId);
}

// Conversion CSV -> Objets (Gère les guillemets et colonnes)
function csvToObjects(csvText) {
    const rows = csvText.split('\n').map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));
    const headers = rows[0].map(h => h.replace(/"/g, '').trim());
    
    return rows.slice(1).map(row => {
        let obj = {};
        row.forEach((val, index) => {
            if (headers[index]) {
                obj[headers[index]] = val ? val.replace(/^"|"$/g, '').trim() : '';
            }
        });
        return obj;
    }).filter(v => v.ID); // On garde seulement si ID existe
}

// Affichage des cartes véhicules
function renderVehicles(list, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; padding:20px;">Aucun véhicule trouvé pour cette catégorie.</p>';
        return;
    }

    list.forEach(v => {
        const imgUrl = convertDriveLink(v.Image_Principale);
        
        // Déterminer si c'est un véhicule d'import
        const isImport = v.Statut && (
            v.Statut.toLowerCase().includes('import') || 
            v.Statut.toLowerCase().includes('commande') ||
            v.Statut.toLowerCase().includes('sur commande') ||
            v.Statut.toLowerCase().includes('importation')
        );

        // Badge différent selon le statut
        let badgeColor, badgeText, badgeTextColor;

        if (isImport) {
            badgeColor = '#2d5a3f'; // Vert pour import
            badgeText = "Import Dubaï";
            badgeTextColor = '#fff';
            
            // Vérifier si c'est une arrivée prochaine
            if (v.Statut.toLowerCase().includes('arrivage') || v.Statut.toLowerCase().includes('transit')) {
                badgeText = "En Transit";
                badgeColor = '#3498db'; // Bleu pour transit
            }
        } else {
            badgeColor = 'var(--gold)'; // Or pour stock
            badgeText = "En occasion";
            badgeTextColor = '#000';
        }

        const card = document.createElement('div');
        card.className = 'vehicle-card fade-in';
        card.innerHTML = `
            <span class="tag-occasion" style="background:${badgeColor}; color:${badgeTextColor};">${badgeText}</span>
            <div class="vehicle-image">
                <img src="${imgUrl}" alt="${v.Nom}" loading="lazy" onerror="this.src='images/logo.png'" onclick="openLightbox('${imgUrl}')">
            </div>
            <div class="vehicle-info">
                <h3>${v.Nom}</h3>
                <p class="vehicle-description">${v.Description || ''}</p>
                <div class="vehicle-meta">
                    <span><i class="fa-solid fa-calendar"></i> ${v.Annee}</span>
                    <span><i class="fa-solid fa-gauge"></i> ${v.Kilometrage}</span>
                    <span><i class="fa-solid fa-gas-pump"></i> ${v.Energie}</span>
                </div>
                <span class="vehicle-price">${v.Prix}</span>
                <div class="btn-container" style="margin-top:auto;">
                    <button class="btn-primary" style="width:100%; margin:0 0 10px 0;" onclick="openDetails('${v.ID}')">Voir détails</button>
                    <button class="btn-secondary" style="width:100%; margin:0;" onclick="contactWhatsApp('${v.Nom}', '${v.Prix}', '${isImport ? 'import' : 'stock'}')">
                        <i class="fa-brands fa-whatsapp"></i> Je suis intéressé
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    observeAnimations();
}

// Fonction de Recherche (Filtrage dynamique)
function filterVehicles(query) {
    const lowerQuery = query.toLowerCase();
    const isImportPage = document.getElementById('import-stock-container');
    
    // On filtre depuis la liste globale "allVehicles"
    const filtered = allVehicles.filter(v => {
        // 1. Correspondance texte
        const matchesText = 
            (v.Nom && v.Nom.toLowerCase().includes(lowerQuery)) || 
            (v.Description && v.Description.toLowerCase().includes(lowerQuery)) ||
            (v.Annee && v.Annee.includes(lowerQuery));
            
        // 2. Correspondance Catégorie (Import ou Stock)
        if (isImportPage) {
            // Sur import.html : on garde seulement si Import + Texte
            const isImport = v.Statut && (v.Statut.toLowerCase().includes('import') || v.Statut.toLowerCase().includes('commande'));
            return matchesText && isImport;
        } else {
            // Sur occasion.html : on garde seulement si Stock + Texte
            const isStock = !v.Statut || (!v.Statut.toLowerCase().includes('import') && !v.Statut.toLowerCase().includes('commande'));
            return matchesText && isStock;
        }
    });

    renderVehicles(filtered, currentContainerId);
}

// Utilitaires (Drive, WhatsApp, Modal, etc.)
function convertDriveLink(link) {
    if (!link) return 'images/logo.png';
    const idMatch = link.match(/[-\w]{25,}/);
    return idMatch ? `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w800` : link;
}

function contactWhatsApp(nom, prix, type) {
    let message = "";
    if (type === 'import') {
        message = `Bonjour, je suis intéressé par l'importation du véhicule : ${nom} (${prix}). Quelles sont les démarches ?`;
    } else {
        message = `Bonjour, je suis intéressé par le véhicule en occasion : ${nom} affiché à ${prix}. Est-il toujours disponible ?`;
    }
    window.open(`https://wa.me/261324452423?text=${encodeURIComponent(message)}`, '_blank');
}

// --- MODAL DETAILS ---
function openDetails(id) {
    const vehicle = allVehicles.find(v => v.ID === id);
    if (!vehicle) return;

    document.getElementById('modalTitle').innerText = vehicle.Nom;
    document.getElementById('modalDesc').innerText = vehicle.Details_Long || vehicle.Description;
    
    const galleryContainer = document.getElementById('modalGallery');
    galleryContainer.innerHTML = '';
    
    addToGallery(convertDriveLink(vehicle.Image_Principale), galleryContainer);

    if (vehicle.Galerie) {
        vehicle.Galerie.split(',').forEach(link => {
            if(link.trim()) addToGallery(convertDriveLink(link.trim()), galleryContainer);
        });
    }

    document.getElementById('vehicleModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function addToGallery(url, container) {
    const img = document.createElement('img');
    img.src = url;
    img.loading = 'lazy';
    img.onclick = function() { openLightbox(this.src); };
    container.appendChild(img);
}

function closeModal() {
    document.getElementById('vehicleModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// --- LIGHTBOX SWIPE ---
function openLightbox(url) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const modalGallery = document.getElementById('modalGallery');
    
    // Récupérer les images de la modale ou juste l'image seule si pas de modale ouverte
    lightboxImages = [];
    if (document.getElementById('vehicleModal').style.display === 'flex' && modalGallery) {
        modalGallery.querySelectorAll('img').forEach(img => lightboxImages.push(img.src));
    } else {
        lightboxImages.push(url); // Juste l'image cliquée
    }
    
    currentImageIndex = lightboxImages.indexOf(url);
    if (currentImageIndex === -1) currentImageIndex = 0;
    
    lightboxImg.src = url;
    lightbox.style.display = 'flex';
    updateLightboxDots();
    makeLightboxSwipeable();
    document.addEventListener('keydown', handleLightboxKeyboard);
    document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
    document.getElementById('lightbox').style.display = 'none';
    document.removeEventListener('keydown', handleLightboxKeyboard);
    if (event) event.preventDefault();
    // Ne pas remettre overflow auto si la modal derrière est ouverte
    if (document.getElementById('vehicleModal').style.display !== 'flex') {
        document.body.style.overflow = 'auto';
    }
}

function makeLightboxSwipeable() {
    const lightboxImg = document.getElementById('lightboxImg');
    let isSwiping = false;

    lightboxImg.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('lightbox-close') || e.target.tagName === 'BUTTON') return;
        startX = e.touches[0].clientX;
        isSwiping = true;
    }, { passive: true });
    
    lightboxImg.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        endX = e.touches[0].clientX;
    }, { passive: true });
    
    lightboxImg.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextImage() : prevImage();
        }
        isSwiping = false;
    }, { passive: true });
}

function nextImage() {
    if (lightboxImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % lightboxImages.length;
    updateLightboxImage();
}

function prevImage() {
    if (lightboxImages.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + lightboxImages.length) % lightboxImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = document.getElementById('lightboxImg');
    img.style.opacity = '0';
    setTimeout(() => {
        img.src = lightboxImages[currentImageIndex];
        img.style.opacity = '1';
        updateLightboxDots();
    }, 200);
}

function updateLightboxDots() {
    const dots = document.getElementById('lightboxDots');
    if(!dots) return;
    dots.innerHTML = lightboxImages.map((_, i) => 
        `<div class="lightbox-dot ${i === currentImageIndex ? 'active' : ''}"></div>`
    ).join('');
}

function handleLightboxKeyboard(e) {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
}

// --- ANIMATIONS & MENU ---
function observeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

// Optimisation Mobile
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) document.querySelector('.nav-links').classList.remove('active');
});