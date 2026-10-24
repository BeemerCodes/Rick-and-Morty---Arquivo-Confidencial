window.App = window.App || {};

window.App.tilt = {
    attachToCard(card) {
        // Ignora rotação 3D em telas touch para o card não ficar inclinado após o toque
        if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
            return;
        }

        card.addEventListener('mousemove', (e) => {
            if (card.dataset.tiltDisabled === 'true') return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -15;
            const rotateY = ((x - centerX) / centerX) * 15;

            card.style.transition = 'none';
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            card.style.zIndex = '10';
        });

        card.addEventListener('mouseleave', () => {
            if (card.dataset.tiltDisabled === 'true') return;

            card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.zIndex = '1';
        });
    }
};
