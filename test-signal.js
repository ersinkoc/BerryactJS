
                import { signal, computed, effect } from './src/index.js';
                const count = signal(0);
                const doubled = computed(() => count.value * 2);
                let effectRan = false;
                effect(() => { effectRan = !!doubled.value; });
                count.value = 5;
                console.log('RESULT:', effectRan && doubled.value === 10);
            