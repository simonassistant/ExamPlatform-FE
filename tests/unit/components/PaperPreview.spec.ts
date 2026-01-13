import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import PaperPreview from 'src/components/paper/PaperPreview.vue';

// Mock Quasar components to avoid needing full Quasar setup
const stubs = {
    'q-banner': { template: '<div class="q-banner"><slot></slot></div>' },
    'q-chip': { template: '<div class="q-chip"><slot></slot></div>' },
    'q-icon': { template: '<i class="q-icon"></i>' },
    'q-separator': true,
    'q-badge': true
};

describe('PaperPreview.vue', () => {
    const defaultPaper = {
        title: 'Test Paper',
        status: 'Draft' as const,
        duration: 60,
        sections: []
    };

    it('renders paper title', () => {
        const wrapper = mount(PaperPreview, {
            props: {
                paper: defaultPaper,
                validationIssues: [],
                showValidation: true
            },
            global: { stubs }
        });

        expect(wrapper.text()).toContain('Test Paper');
    });

    it('shows validation summary when errors exist', () => {
        const wrapper = mount(PaperPreview, {
            props: {
                paper: defaultPaper,
                validationIssues: [
                    { type: 'error', path: 'test', message: 'Error 1' },
                    { type: 'warning', path: 'test', message: 'Warning 1' }
                ],
                showValidation: true
            },
            global: { stubs }
        });

        const summary = wrapper.find('.validation-summary');
        expect(summary.exists()).toBe(true);
        expect(summary.text()).toContain('Error 1');
        expect(summary.text()).toContain('Warning 1');
    });

    it('hides validation summary when showValidation is false', () => {
        const wrapper = mount(PaperPreview, {
            props: {
                paper: defaultPaper,
                validationIssues: [{ type: 'error', path: 'test', message: 'Error 1' }],
                showValidation: false
            },
            global: { stubs }
        });

        expect(wrapper.find('.validation-summary').exists()).toBe(false);
    });
});
