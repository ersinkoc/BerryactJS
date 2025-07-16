
                import { signal, computed } from './src/index.js';
                
                const start = performance.now();
                const count = signal(0);
                const doubled = computed(() => count.value * 2);
                
                // Simulate 1000 updates
                for (let i = 0; i < 1000; i++) {
                    count.value = i;
                }
                
                const end = performance.now();
                const duration = end - start;
                
                console.log('RESULT:', duration < 100); // Less than 100ms
            