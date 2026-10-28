document.addEventListener('DOMContentLoaded', () => {
    const ringContainer = document.getElementById('ring-container');
    const items = document.querySelectorAll('.ring-item');
    const rotaryItems = document.querySelectorAll('.rotary-item');
    const projectLink = document.getElementById('project-link');

    let currentRotationY = 0;
    let currentRotationX = 0;
    let activeCategory = 'all';
    let activeIndex = null;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let filterTimeout = null;

    const radiusX = 320; 
    const radiusZ = 240; 

    // Funzione per controllare se un elemento appartiene alla categoria attiva
    const itemMatchesCategory = (item, category) => {
        if (category === 'all') return true;
        const itemCategories = item.getAttribute('data-category') || '';
        return itemCategories.split(' ').includes(category);
    };

    // Funzione per calcolare la profondità e riordinare il DOM (Painter's Algorithm)
    const updateZIndicesAndSort = () => {
        const radY = currentRotationY * (Math.PI / 180);
        
        items.forEach((item) => {
            if (item.classList.contains('filtered-out')) return;
            const baseX = parseFloat(item.dataset.baseX || 0);
            const baseZ = parseFloat(item.dataset.baseZ || 0);
            item.dataset.effectiveZ = baseX * Math.sin(radY) + baseZ * Math.cos(radY);
        });

        const visibleItemsArray = Array.from(items).filter(item => !item.classList.contains('filtered-out'));
        visibleItemsArray.sort((a, b) => parseFloat(a.dataset.effectiveZ) - parseFloat(b.dataset.effectiveZ));
        
        visibleItemsArray.forEach(item => {
            ringContainer.appendChild(item);
        });
    };

    const updateRingPositions = (categoryToFilter, immediateHide = false) => {
        const visibleItems = Array.from(items).filter(item => {
            return itemMatchesCategory(item, categoryToFilter);
        });

        items.forEach((item) => {
            const matches = itemMatchesCategory(item, categoryToFilter);
            if (immediateHide && !matches) {
                item.classList.add('filtered-out');
            } else {
                item.classList.remove('filtered-out');
            }
        });

        const activePool = categoryToFilter === 'all' ? Array.from(items) : visibleItems;
        
        activePool.forEach((item, index) => {
            const angle = (index / activePool.length) * Math.PI * 2;
            const offsetY = (index % 3 - 1) * 70; 
            
            const x = Math.cos(angle) * radiusX;
            let z = Math.sin(angle) * radiusZ;
            
            if (z > 0) {
                z += 120; 
            }

            const rotY = -(angle * (180 / Math.PI)) + 105;

            item.dataset.baseX = x;
            item.dataset.baseY = offsetY;
            item.dataset.baseZ = z;
            item.dataset.baseRotY = rotY;

            if (activeIndex !== Array.from(items).indexOf(item)) {
                item.style.transform = `translate3d(${x}px, ${offsetY}px, ${z}px) rotateY(${rotY}deg)`;
                item.style.opacity = itemMatchesCategory(item, categoryToFilter) ? '1' : '0.3';
            }
        });

        updateZIndicesAndSort();
    };

    ringContainer.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
    updateRingPositions('all', true);

    rotaryItems.forEach(rotItem => {
        rotItem.addEventListener('click', () => {
            rotaryItems.forEach(i => i.classList.remove('selected', 'adjacent'));
            rotItem.classList.add('selected');
            
            activeCategory = rotItem.getAttribute('data-category');
            activeIndex = null;
            if(projectLink) projectLink.classList.remove('visible');

            if (activeCategory === 'favorites') {
                currentRotationX = 15;
                currentRotationY = 15;
            } else if (activeCategory === 'visual-identity') {
                currentRotationX = 0; 
                currentRotationY = -90;
            } else if (activeCategory === 'poster-design') {
                currentRotationX = 20; 
                currentRotationY = 65;
            } else if (activeCategory === 'printed-matter') {
                currentRotationX = 30; 
                currentRotationY = 0;
            } else if (activeCategory === 'audiovisual') {
                currentRotationX = 10; 
                currentRotationY = 30;
            } else if (activeCategory === 'altro') {
                currentRotationX = 35; 
                currentRotationY = -50;
            } else {
                currentRotationX = 0; 
                currentRotationY = 0; 
            }

            ringContainer.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;

            clearTimeout(filterTimeout);
            updateRingPositions(activeCategory, false);

            filterTimeout = setTimeout(() => {
                items.forEach(item => {
                    const matches = itemMatchesCategory(item, activeCategory);
                    if (!matches) {
                        item.classList.add('filtered-out');
                    }
                });
                updateZIndicesAndSort();
            }, 750);
        });
    });

    window.addEventListener('mousedown', (e) => {
        if(e.target.closest('header') || e.target.closest('footer') || e.target.closest('.rotary-filter-sidebar') || e.target.closest('#project-link')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        startX = e.clientX;
        startY = e.clientY;

        currentRotationY += deltaX * 0.4;
        currentRotationX -= deltaY * 0.4;

        ringContainer.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
        
        updateZIndicesAndSort();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    items.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (activeIndex === index) {
                activeIndex = null;
                if(projectLink) projectLink.classList.remove('visible');
                updateRingPositions(activeCategory, true);
                return;
            }

            activeIndex = index;
            items.forEach(el => el.style.opacity = '0.1');
            item.style.opacity = '2';

            ringContainer.appendChild(item); 
            item.style.transform = `translate3d(${item.dataset.baseX}px, ${item.dataset.baseY}px, ${Number(item.dataset.baseZ)}px) rotateY(${item.dataset.baseRotY}deg) scale(1.15)`;

            if (projectLink) {
                projectLink.textContent = item.getAttribute('data-title');
                projectLink.href = item.getAttribute('data-url');
                projectLink.classList.add('visible');
                const rect = item.getBoundingClientRect();
                projectLink.style.left = `${rect.left + rect.width / 2}px`;
                projectLink.style.top = `${rect.bottom + 10}px`;
            }
        });
    });

    document.addEventListener('click', () => {
        if (activeIndex !== null) {
            activeIndex = null;
            if(projectLink) projectLink.classList.remove('visible');
            updateRingPositions(activeCategory, true);
        }
    });
});