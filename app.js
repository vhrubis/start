const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('search-btn');
const suggestionsList = document.getElementById('suggestions');
const resultsContainer = document.getElementById('song-info');
const lyricsDisplay = document.getElementById('lyrics');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const loadingIndicator = document.getElementById('loading');
const chordLinkContainer = document.getElementById('chord-link-container');

const API_URL = 'https://api.lyrics.ovh';

// Handle suggestions as user types
searchInput.addEventListener('input', async (e) => {
    const term = e.target.value.trim();
    if (term.length < 3) {
        suggestionsList.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/suggest/${term}`);
        const data = await res.json();
        showSuggestions(data.data);
    } catch (err) {
        console.error('Error fetching suggestions:', err);
    }
});

function showSuggestions(songs) {
    suggestionsList.innerHTML = songs
        .slice(0, 5)
        .map(song => `
            <div class="suggestion-item" data-artist="${song.artist.name}" data-title="${song.title}">
                <strong>${song.title}</strong> - ${song.artist.name}
            </div>
        `)
        .join('');

    // Add click listeners to suggestions
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const artist = item.getAttribute('data-artist');
            const title = item.getAttribute('data-title');
            searchInput.value = `${artist} - ${title}`;
            suggestionsList.innerHTML = '';
            getLyrics(artist, title);
        });
    });
}

// Handle search button click
searchBtn.addEventListener('click', () => {
    const term = searchInput.value.trim();
    if (!term) return;

    // Simple parser if user typed "Artist - Title"
    if (term.includes(' - ')) {
        const [artist, title] = term.split(' - ');
        getLyrics(artist.trim(), title.trim());
    } else {
        // Fallback: search for suggestions and take the first one
        searchFirstResult(term);
    }
});

async function searchFirstResult(term) {
    loadingIndicator.classList.remove('hidden');
    resultsContainer.classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/suggest/${term}`);
        const data = await res.json();
        if (data.data.length > 0) {
            const first = data.data[0];
            getLyrics(first.artist.name, first.title);
        } else {
            alert('Píseň nebyla nalezena.');
            loadingIndicator.classList.add('hidden');
        }
    } catch (err) {
        alert('Chyba při vyhledávání.');
        loadingIndicator.classList.add('hidden');
    }
}

async function getLyrics(artist, title) {
    loadingIndicator.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    suggestionsList.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/v1/${artist}/${title}`);
        const data = await res.json();

        if (data.lyrics) {
            displayResults(artist, title, data.lyrics);
        } else {
            displayResults(artist, title, 'Text k této písni bohužel nebyl nalezen.');
        }
    } catch (err) {
        displayResults(artist, title, 'Chyba při stahování textu.');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function displayResults(artist, title, lyrics) {
    songTitle.innerText = title;
    songArtist.innerText = artist;
    lyricsDisplay.innerText = lyrics;

    // Create external chord link
    const query = encodeURIComponent(`${artist} ${title} chords`);
    chordLinkContainer.innerHTML = `
        <a id="chord-link" href="https://www.ultimate-guitar.com/search.php?search_type=title&value=${query}" target="_blank">
            🎸 Najít akordy na Ultimate Guitar
        </a>
    `;

    resultsContainer.classList.remove('hidden');
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target)) {
        suggestionsList.innerHTML = '';
    }
});
