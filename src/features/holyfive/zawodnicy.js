document.addEventListener('DOMContentLoaded', function() {
    // Pobranie elementów DOM
    const loadingScreen = document.getElementById('loadingScreen');
    const pageContent = document.getElementById('pageContent');
    const sectionTitle = document.querySelector('.section-title');
    const playerCard = document.getElementById('playerCard');
    const playerCard2 = document.getElementById('playerCard2');
    const playerCard3 = document.getElementById('playerCard3');
    const playerCard4 = document.getElementById('playerCard4');
    const playerCard5 = document.getElementById('playerCard5');
    const holyFiveTitle = document.getElementById('holyFiveTitle');
    const actionButtons = document.getElementById('actionButtons');
    const mainElement = document.querySelector('main');
    const spacerElement = document.querySelector('.spacer');
    const cornerElements = document.querySelectorAll('.corner-element');
    
    // Elementy modalne
    const teamHistoryBtn = document.getElementById('teamHistoryBtn');
    const teamHistoryModal = document.getElementById('teamHistoryModal');
    const closeHistoryModal = document.getElementById('closeHistoryModal');
    
    // Ustawienie main jako sticky
    mainElement.style.position = 'sticky';
    mainElement.style.top = '132px';
    mainElement.style.zIndex = '25';
    
    // Tablica z wszystkimi kartami zawodników
    const playerCards = [playerCard, playerCard2, playerCard3, playerCard4, playerCard5];
    
    // Pozycje docelowe kart
    const cardWidth = 270; // Szerokość karty po zmniejszeniu (0.6 skali)
    const cardSpacing = 50; // Odstęp między kartami
    const totalWidth = (5 * cardWidth) + (4 * cardSpacing); // Całkowita szerokość wszystkich kart
    const startX = -(totalWidth / 2) + (cardWidth / 2); // Pozycja startowa (środek pierwszej karty)
    
    // Obliczamy pozycje dla każdej karty
    const positions = [
        startX, // Pierwsza karta - maksymalnie w lewo
        startX + (4 * (cardWidth + cardSpacing)), // Druga karta - maksymalnie w prawo
        startX + (cardWidth + cardSpacing), // Trzecia karta - w lewo obok pierwszej
        startX + (3 * (cardWidth + cardSpacing)), // Czwarta karta - w prawo obok drugiej
        startX + (2 * (cardWidth + cardSpacing)) // Piąta karta - środek
    ];
    
    // Wartości przewijania dla efektu paralaksy - zmienione tak, aby kolejne karty pojawiały się sekwencyjnie
    const scrollBreakpoints = {
        titleFadeStart: 200,
        titleFadeEnd: 350,
        
        // Wartości dla pierwszej karty
        card1Start: 250, // Początek animacji karty 1
        card1Shrink: 500, 
        card1Position: 700, 
        
        // Wartości dla drugiej karty - zaczyna się po zakończeniu animacji pierwszej
        card2Start: 750, 
        card2Shrink: 1000, 
        card2Position: 1250, 
        
        // Wartości dla trzeciej karty - zaczyna się po zakończeniu animacji drugiej
        card3Start: 1250, 
        card3Shrink: 1500, 
        card3Position: 1750, 
        
        // Wartości dla czwartej karty - zaczyna się po zakończeniu animacji trzeciej
        card4Start: 1750, 
        card4Shrink: 2000, 
        card4Position: 2250, 
        
        // Wartości dla piątej karty - zaczyna się po zakończeniu animacji czwartej
        card5Start: 2250, 
        card5Shrink: 2500, 
        card5Position: 2750, 
        
        // Wartość dla pojawienia się tytułu "HOLY FIVE" - po zakończeniu wszystkich animacji kart
        titleAppear: 2750, 
        
        // Wartość dla pojawienia się przycisków - blisko tytułu
        buttonsAppear: 2800, // Zmniejszono z 3250
        
        // Maksymalna wartość przewijania
        maxScroll: 3000 // Zmniejszono z 3750
    };

    // Funkcja do animacji "maszyny losującej" dla napisu HOLY FIVE
    function slotMachineEffect(element, finalWord, duration = 2000) {
        const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(){}[]<>?/|\\';
        element.innerHTML = '';
        
        const wordContainer = document.createElement('div');
        wordContainer.style.display = 'flex';
        wordContainer.style.justifyContent = 'center';
        wordContainer.style.width = '100%';
        wordContainer.style.gap = '0.1em';
        element.appendChild(wordContainer);
        
        const letterContainers = [];
        const chars = finalWord.split('');
        
        for (let i = 0; i < chars.length; i++) {
            const letterSpan = document.createElement('span');
            letterSpan.style.display = 'inline-block';
            
            if (chars[i] === ' ') {
                letterSpan.style.width = '0.3em';
                letterSpan.textContent = ' ';
            } else {
                letterSpan.style.width = '0.8em';
                letterSpan.style.textAlign = 'center';
                letterSpan.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.2)';
            }
            
            wordContainer.appendChild(letterSpan);
            letterContainers.push(letterSpan);
        }
        
        letterContainers.forEach((container, index) => {
            if (chars[index] === ' ') return;
            
            let startTime = null;
            const letterDuration = duration * 0.7 - (index * 150);
            const minChanges = 10;
            let changes = 0;
            
            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                
                const progress = Math.min(1, elapsed / letterDuration);
                
                if (progress < 1 || changes < minChanges) {
                    const changeSpeed = Math.max(30, 150 * (1 - progress));
                    
                    if (elapsed % changeSpeed < 16) {
                        changes++;
                        const correctChance = progress * progress;
                        
                        if (Math.random() > correctChance || changes < minChanges / 2) {
                            const randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
                            container.textContent = randomChar;
                            container.style.transform = `translateY(${Math.random() * 2 - 1}px)`;
                        } else {
                            container.textContent = chars[index];
                            container.style.transform = 'translateY(0)';
                        }
                    }
                    
                    requestAnimationFrame(animate);
                } else {
                    container.textContent = chars[index];
                    container.style.transform = 'translateY(0)';
                    // Po zakończeniu animacji nie dodajemy dodatkowej poświaty,
                    // żeby tekst był maksymalnie ostry
                    container.style.textShadow = 'none';
                }
            }
            
            setTimeout(() => {
                requestAnimationFrame(animate);
            }, index * 100);
        });
    }

    // Funkcja wyrównująca wysokość elementów
    function equalizeCardInnerHeights() {
        const cardInners = document.querySelectorAll('.card-inner');
        
        if (cardInners.length === 0) return;
        
        const referenceHeight = cardInners[0].offsetHeight;
        
        cardInners.forEach(cardInner => {
            cardInner.style.height = referenceHeight + 'px';
        });
        
        const playerTexts = document.querySelectorAll('.player-text');
        const playerInfos = document.querySelectorAll('.player-info');
        
        if (playerTexts.length > 0 && playerInfos.length > 0) {
            const referenceTextWidth = playerTexts[0].offsetWidth;
            const referenceInfoHeight = playerInfos[0].offsetHeight;
            
            playerTexts.forEach(text => {
                text.style.width = referenceTextWidth + 'px';
            });
            
            playerInfos.forEach(info => {
                info.style.height = referenceInfoHeight + 'px';
            });
        }
    }
    
    // Obsługa kliknięć dla kart zawodników
    function handlePlayerCardClick(event) {
        if (event.target.closest('.social-link')) {
            return;
        }
        
        event.stopPropagation();
    }
    
    // Dodajemy obsługę kliknięć do kart
    document.querySelectorAll('.player-card').forEach(card => {
        card.addEventListener('click', handlePlayerCardClick);
    });
    
    // Symulacja ładowania
    setTimeout(() => {
        loadingScreen.classList.add('leave-transition');
        loadingScreen.classList.add('hidden');
        pageContent.classList.remove('hidden');
        
        setTimeout(equalizeCardInnerHeights, 100);
    }, 800);
    
    // Obsługa otwierania/zamykania modali
    teamHistoryBtn.addEventListener('click', () => {
        teamHistoryModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
    
    closeHistoryModal.addEventListener('click', () => {
        teamHistoryModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Zamykanie modalu przy kliknięciu poza zawartością
    window.addEventListener('click', (event) => {
        if (event.target === teamHistoryModal) {
            teamHistoryModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Obsługa efektu przewijania
    window.addEventListener('scroll', () => {
        // Pobieramy aktualną pozycję przewijania
        let scrollPosition = window.scrollY;
        
        // Debugowanie - wyświetlanie pozycji scrollowania w konsoli
        console.log("Scroll Position:", scrollPosition);
        
        // Ograniczamy pozycję przewijania do maksymalnej wartości
        if (scrollPosition > scrollBreakpoints.maxScroll) {
            scrollPosition = scrollBreakpoints.maxScroll;
        }
        
        // Obsługa tytułu "Skład Główny" i narożników
        if (scrollPosition > scrollBreakpoints.titleFadeStart) {
            const titleOpacity = 1 - ((scrollPosition - scrollBreakpoints.titleFadeStart) / 
                                     (scrollBreakpoints.titleFadeEnd - scrollBreakpoints.titleFadeStart));
            sectionTitle.style.opacity = Math.max(0, titleOpacity);
            // Ustawiamy tę samą przezroczystość dla narożników
            cornerElements.forEach(corner => {
                corner.style.opacity = Math.max(0, titleOpacity);
            });
        } else {
            sectionTitle.style.opacity = 1;
            cornerElements.forEach(corner => {
                corner.style.opacity = 1;
            });
        }
        
        // Zmienna śledząca czy wszystkie karty są na swoich miejscach
        let allCardsInPosition = false;
        
        // Funkcja do obsługi animacji karty
        function handleCardAnimation(card, startPos, shrinkPos, finalPos, index) {
            if (scrollPosition > startPos) {
                // Pokazujemy kartę
                const cardOpacity = (scrollPosition - startPos) / 100;
                card.style.opacity = Math.min(1, cardOpacity);
                
                // Ustawiamy początkowe transformacje
                let translateY = Math.max(0, 50 - (scrollPosition - startPos) / 2);
                let scale = 1;
                let translateX = 0;
                
                // Zmniejszamy kartę po dalszym przewinięciu
                if (scrollPosition > shrinkPos) {
                    scale = 1 - ((scrollPosition - shrinkPos) / (finalPos - shrinkPos) * 0.4);
                    scale = Math.max(0.6, scale);
                    
                    // Przesuwamy kartę do docelowej pozycji
                    if (scrollPosition > shrinkPos && scale <= 0.6) {
                        const moveProgress = Math.min(1, (scrollPosition - shrinkPos) / (finalPos - shrinkPos));
                        translateX = positions[index] * moveProgress;
                    }
                    
                    // Gdy przekroczymy wartość finalPos, ustalamy ostateczną pozycję karty
                    if (scrollPosition >= finalPos) {
                        scale = 0.6; // Stały rozmiar po zakończeniu animacji
                        translateX = positions[index]; // Docelowa pozycja X
                    }
                }
                
                // Łączymy wszystkie transformacje
                card.style.transform = `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`;
            } else {
                card.style.opacity = 0;
                card.style.transform = 'translateY(50px)';
            }
            
            // Sprawdzamy, czy karta osiągnęła swoją pozycję docelową
            return (scrollPosition >= finalPos);
        }
        
        // Animujemy każdą kartę sekwencyjnie, każda następna zaczyna się dopiero po zakończeniu poprzedniej
        const card1InPosition = handleCardAnimation(playerCard, scrollBreakpoints.card1Start, scrollBreakpoints.card1Shrink, 
                           scrollBreakpoints.card1Position, 0);
        
        const card2InPosition = handleCardAnimation(playerCard2, scrollBreakpoints.card2Start, scrollBreakpoints.card2Shrink, 
                           scrollBreakpoints.card2Position, 1);
        
        const card3InPosition = handleCardAnimation(playerCard3, scrollBreakpoints.card3Start, scrollBreakpoints.card3Shrink, 
                           scrollBreakpoints.card3Position, 2);
        
        const card4InPosition = handleCardAnimation(playerCard4, scrollBreakpoints.card4Start, scrollBreakpoints.card4Shrink, 
                           scrollBreakpoints.card4Position, 3);
        
        const card5InPosition = handleCardAnimation(playerCard5, scrollBreakpoints.card5Start, scrollBreakpoints.card5Shrink, 
                           scrollBreakpoints.card5Position, 4);
        
        // Sprawdzamy, czy wszystkie karty osiągnęły swoje pozycje docelowe
        allCardsInPosition = card1InPosition && card2InPosition && card3InPosition && card4InPosition && card5InPosition;
        
        // Pokazujemy napis HOLY FIVE po zakończeniu animacji wszystkich kart
        if (allCardsInPosition && scrollPosition > scrollBreakpoints.titleAppear) {
            if (holyFiveTitle.style.opacity !== "1") {
                holyFiveTitle.style.opacity = "1";
                holyFiveTitle.innerHTML = '';
                
                // Uruchamiamy animację dla napisu HOLY FIVE
                slotMachineEffect(holyFiveTitle, 'HOLY FIVE', 2000);
            }
        } else {
            if (holyFiveTitle.style.opacity !== "0") {
                holyFiveTitle.style.opacity = "0";
                
                // Czekamy na zakończenie animacji znikania przed wyczyszczeniem zawartości
                setTimeout(() => {
                    if (holyFiveTitle.style.opacity === "0") {
                        holyFiveTitle.innerHTML = '';
                    }
                }, 1000);
            }
        }
        
        // Pokazujemy przyciski po napisie HOLY FIVE
        if (scrollPosition > scrollBreakpoints.buttonsAppear) {
            // Nie zmieniamy opacity przycisków, są zawsze widoczne
            console.log("Przyciski zawsze widoczne");
        }
    });
    
    // Umieszczamy przyciski i footer wyżej
    setTimeout(() => {
        // Podnosimy przyciski wyżej
        const actionButtons = document.getElementById('actionButtons');
        if (actionButtons) {
            actionButtons.style.marginTop = "-80px";
            actionButtons.style.marginBottom = "30px";
            actionButtons.style.position = "relative";
            actionButtons.style.zIndex = "50"; // Wyższy z-index niż footer
        }
        
        // Ustawiamy footer na dole strony
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.style.marginTop = "0";
            footer.style.position = "relative";
            footer.style.zIndex = "40"; // Niższy z-index niż przyciski
            
            // Zmniejszamy padding w footerze
            footer.style.paddingTop = "10px";
            
            // Usuwamy wideo z footera
            const footerVideo = footer.querySelector('.footer-video');
            if (footerVideo) {
                footerVideo.style.display = 'none';
            }
            
            // Usuwamy separator w footerze (jeśli istnieje)
            const footerSeparator = footer.querySelector('.footer-separator');
            if (footerSeparator) {
                footerSeparator.style.display = 'none';
            }
            
            // Przenosimy menu footera na środek wysokości
            const rightFooterSection = footer.querySelector('.right-footer-section');
            if (rightFooterSection) {
                rightFooterSection.style.display = 'flex';
                rightFooterSection.style.justifyContent = 'center';
                rightFooterSection.style.alignItems = 'center';
                rightFooterSection.style.height = '100%';
            }
            
            const footerMenu = footer.querySelector('.footer-menu');
            if (footerMenu) {
                footerMenu.style.margin = '0';
                footerMenu.style.padding = '0';
                footerMenu.style.display = 'flex';
                footerMenu.style.justifyContent = 'center';
                footerMenu.style.gap = '20px';
            }
            
            // Dostosowujemy strukturę footera
            footer.style.display = 'flex';
            footer.style.alignItems = 'center';
            footer.style.justifyContent = 'space-between';
            footer.style.padding = '15px 30px';
            
            // Poprawiamy pozycję copyright
            const copyright = footer.querySelector('.copyright');
            if (copyright) {
                copyright.style.position = 'absolute';
                copyright.style.bottom = '5px';
                copyright.style.left = '50%';
                copyright.style.transform = 'translateX(-50%)';
                copyright.style.fontSize = '0.8rem';
            }
        }
    }, 1000);
    
    // Wywołujemy funkcję wyrównującą wysokości przy zmianie rozmiaru okna
    window.addEventListener('load', equalizeCardInnerHeights);
    window.addEventListener('resize', equalizeCardInnerHeights);
    window.addEventListener('zoom', equalizeCardInnerHeights);
    
    // Dostosowujemy wysokość spacera, aby uniknąć zbędnego przewijania
    const spacer = document.querySelector('.spacer');
    if (spacer) {
        // Ustawiamy odpowiednią wysokość spacera
        spacer.style.height = '300vh'; // Zwiększono, aby pomieścić więcej przewijania
    }
}); 
