let pdfFiles = []; // Array per memorizzare i dettagli dei PDF trovati nella directory
let selectedPdfs = []; // Array per memorizzare i PDF selezionati dall'utente

$(document).ready(function () {
    $("#selectedScenesList").sortable(); // Inizializza jQuery UI per lista riordinabile
    $("#selectedScenesList").disableSelection(); // Disabilita la selezione di testo nella lista riordinabile
});

function selectDirectory() {
    // Trigger del file input per selezionare la directory
    const directoryInput = document.getElementById('directoryInput');
    directoryInput.click();
}

function loadDirectory() {
    const fileInput = document.getElementById('directoryInput');
    if (fileInput.files.length === 0) {
        alert('Seleziona una directory con file PDF!');
        return;
    }

    // Resetta gli array e l'interfaccia
    pdfFiles = [];
    selectedPdfs = [];
    updateAvailableScenesList();
    updateSelectedScenesList();

    // Raccoglie i file PDF dalla directory e dalle sottocartelle
    for (const file of fileInput.files) {
        if (file.name.toLowerCase().endsWith('.pdf')) {
            pdfFiles.push({
                path: file.webkitRelativePath,  // Usa il percorso relativo per identificare univocamente il file
                name: file.name,
                displayName: file.name.replace(/\.pdf$/i, ''), // Rimuove l'estensione .pdf
                file: file
            });
        }
    }

    // Ordina la lista dei PDF alfabeticamente
    pdfFiles.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // Aggiorna la lista delle scene disponibili
    updateAvailableScenesList();
}

function updateAvailableScenesList() {
    const availableScenesList = document.getElementById('availableScenesList');
    availableScenesList.innerHTML = ''; // Svuota la lista delle scene disponibili

    pdfFiles.forEach((pdf) => {
        const div = document.createElement('div');
        div.textContent = pdf.displayName;
        div.classList.add('scene-item');
        div.setAttribute('data-pdf-path', pdf.path); // Collega direttamente il PDF all'elemento usando il percorso
        div.onclick = () => addSceneFromList(pdf.path);
        availableScenesList.appendChild(div);
    });
}

function addSceneFromList(pdfPath) {
    const pdf = pdfFiles.find((pdf) => pdf.path === pdfPath);
    if (pdf && !selectedPdfs.some((p) => p.path === pdf.path)) {
        selectedPdfs.push(pdf);
        updateSelectedScenesList();
    }
}

function searchScenes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const availableScenesList = document.getElementById('availableScenesList');
    availableScenesList.innerHTML = ''; // Svuota la lista per il nuovo filtro

    pdfFiles
        .filter(pdf => pdf.displayName.toLowerCase().includes(searchTerm))
        .forEach((pdf) => {
            const div = document.createElement('div');
            div.textContent = pdf.displayName;
            div.classList.add('scene-item');
            div.setAttribute('data-pdf-path', pdf.path);
            div.onclick = () => addSceneFromList(pdf.path);
            availableScenesList.appendChild(div);
        });
}

function updateSelectedScenesList() {
    const selectedScenesList = document.getElementById('selectedScenesList');
    selectedScenesList.innerHTML = ''; // Svuota la lista delle scene selezionate

    selectedPdfs.forEach((pdf) => {
        const li = document.createElement('li');

        // Contenitore per il nome della scena
        const sceneName = document.createElement('span');
        sceneName.textContent = pdf.displayName;
        sceneName.classList.add('scene-name');

        // Aggiungi il pulsante "X" per rimuovere la scena
        const removeButton = document.createElement('button');
        removeButton.textContent = 'X';
        removeButton.classList.add('remove-button');
        removeButton.onclick = () => removeScene(pdf.path);

        li.appendChild(sceneName);
        li.appendChild(removeButton);
        li.setAttribute('data-pdf-path', pdf.path);
        selectedScenesList.appendChild(li);
    });
}

function removeScene(pdfPath) {
    selectedPdfs = selectedPdfs.filter((pdf) => pdf.path !== pdfPath);
    updateSelectedScenesList();
}

function clearAllScenes() {
    selectedPdfs = [];
    updateSelectedScenesList();
}

function sortSelectedScenes() {
    selectedPdfs.sort((a, b) => a.displayName.localeCompare(b.displayName));
    updateSelectedScenesList();
}

async function mergePdfs() {
    if (selectedPdfs.length === 0) {
        alert('Nessun PDF selezionato per l\'unione!');
        return;
    }

    // Chiedi all'utente di inserire il nome del file
    let fileName = prompt('Inserisci il nome del file per il PDF unito:', 'Merged.pdf');
    if (!fileName) {
        fileName = 'Merged.pdf';
    } else if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName += '.pdf';
    }

    const mergerPdf = await PDFLib.PDFDocument.create();

    for (const pdf of selectedPdfs) {
        const arrayBuffer = await pdf.file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pages = await mergerPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

        pages.forEach((page) => {
            mergerPdf.addPage(page);
        });
    }

    const pdfBytes = await mergerPdf.save();
    download(pdfBytes, fileName, "application/pdf");
}

function download(data, filename, type) {
    const blob = new Blob([data], { type: type });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
}
