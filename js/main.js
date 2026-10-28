document.addEventListener('DOMContentLoaded', () => {
    const introText = document.getElementById('intro-text');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryContainer = document.getElementById('gallery-container');

    let isMouseMoving = false;
    let activeIndex = null;

    const hideTextOnMove = () => {
        if (!isMouseMoving) {
            introText.style.opacity = '0';
            document.body.classList.add('text-hidden');
            isMouseMoving = true;
            document.removeEventListener('mousemove', hideTextOnMove);
        }
    };
    document.addEventListener('mousemove', hideTextOnMove);

    const totalItems = galleryItems.length;

    const updateGallery = (mouseX = -1000) => {
        const containerWidth = galleryContainer.clientWidth;
        const itemWidth = 220; 
        
        const maxGalleryWidth = containerWidth * 0.80;
        const step = totalItems > 1 ? (maxGalleryWidth - itemWidth) / (totalItems - 1) : 0;
        
        const totalGroupWidth = (totalItems - 1) * step + itemWidth;
        const startX = (containerWidth - totalGroupWidth) / 2;

        const containerRect = galleryContainer.getBoundingClientRect();

        let closestIndex = -1;
        let minDistance = Infinity;

        if (mouseX >= 0 && activeIndex === null) {
            galleryItems.forEach((item, index) => {
                let baseX = startX + (index * step);
                const itemScreenX = containerRect.left + baseX;
                const distance = Math.abs(mouseX - itemScreenX);
                if (distance < minDistance && distance < 300) {
                    minDistance = distance;
                    closestIndex = index;
                }
            });
        }

        galleryItems.forEach((item, index) => {
            let baseX = startX + (index * step);
            let baseZ = 0; 
            let baseRotateY = -55;

            let isClicked = (activeIndex === index);
            if (isClicked) {
                baseRotateY = 0;
                baseZ += 300; 
            }

            let isHovered = (closestIndex === index);
            if (isHovered && !isClicked) {
                const itemScreenX = containerRect.left + baseX;
                const distance = mouseX - itemScreenX;
                baseRotateY += (distance > 0 ? 22 : -22);
            }

            let pushEffect = 0;
            if (activeIndex !== null) {
                if (index < activeIndex) {
                    pushEffect = -100;
                } else if (index > activeIndex) {
                    pushEffect = 100;
                }
            }

            let finalX = baseX + pushEffect;

            item.style.transform = `translateX(${finalX}px) translateZ(${baseZ}px) rotateY(${baseRotateY}deg)`;

            if (isClicked) {
                item.style.zIndex = 10000;
            } else if (isHovered) {
                item.style.zIndex = 5000;
            } else if (activeIndex !== null) {
                item.style.zIndex = index < activeIndex ? index : (totalItems - index);
            } else {
                item.style.zIndex = index;
            }
        });
    };

    updateGallery();
    
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        updateGallery();
    });

    window.addEventListener('mousemove', (e) => {
        if (activeIndex === null) {
            updateGallery(e.clientX);
        }
    });

    // Gestione logica al Click sui lavori
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();

            if (activeIndex === index) {
                // Secondo click sullo stesso lavoro già attivo (frontale): Apri la pagina
                const targetUrl = item.getAttribute('data-url');
                if (targetUrl && targetUrl !== '#') {
                    window.location.href = targetUrl;
                }
            } else {
                // Primo click: Ruota in orizzontale e porta in evidenza
                activeIndex = index;
                updateGallery();
            }
        });
    });

    // Click fuori per resettare la vista
    document.addEventListener('click', () => {
        if (activeIndex !== null) {
            activeIndex = null;
            updateGallery();
        }
    });

    // Navigazione da tastiera
    document.addEventListener('keydown', (e) => {
        if (activeIndex === null) return;

        if (e.key === 'ArrowRight') {
            activeIndex = (activeIndex + 1) % totalItems;
            updateGallery();
        } else if (e.key === 'ArrowLeft') {
            activeIndex = (activeIndex - 1 + totalItems) % totalItems;
            updateGallery();
        } else if (e.key === 'Escape') {
            activeIndex = null;
            updateGallery();
        } else if (e.key === 'Enter') {
            // Permette l'apertura anche premendo Invio da tastiera
            const currentItem = galleryItems[activeIndex];
            const targetUrl = currentItem.getAttribute('data-url');
            if (targetUrl && targetUrl !== '#') {
                window.location.href = targetUrl;
            }
        }
    });
});