import { ref, watch, nextTick, computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
  name: 'ScriptOutput',
  props: {
    output: {
      type: Array,
      required: true
    }
  },
  emits: ['clear'],
  data() {
    return {
      isFullScreen: false
    };
  },
  template: `
    <div class="bg-white p-4 rounded-lg shadow h-full flex flex-col overflow-hidden w-full">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Output</h2>
        <div class="flex items-center gap-2">
          <div class="relative">
            <input
              type="text"
              v-model="searchTerm"
              placeholder="Search output..."
              class="px-3 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
            <button
              v-if="searchTerm"
              @click="searchTerm = ''"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <button
            @click="toggleFullScreen"
            class="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded flex items-center"
            title="Toggle full-screen mode"
          >
            <span v-if="!isFullScreen">⤢</span>
            <span v-else>⤓</span>
          </button>
          <button
            @click="$emit('clear')"
            class="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            :disabled="output.length === 0"
            :class="{ 'opacity-50 cursor-not-allowed': output.length === 0 }"
          >
            Clear
          </button>
        </div>
      </div>
      <div ref="outputContainer" class="bg-gray-900 text-white p-4 rounded font-mono flex-grow overflow-y-auto whitespace-pre-wrap leading-relaxed text-sm h-[calc(100%-3rem)] w-full">
        <div
          v-for="(line, index) in filteredOutput"
          :key="index"
          class="mb-2"
        >
          <div class="flex items-start">
            <span class="text-xs text-gray-500 mr-2 whitespace-nowrap">{{ line.timestamp || '' }}</span>
            <div :class="lineClass(line)" v-html="formatOutputWithHighlight(line.data)"></div>
          </div>
        </div>
        <div v-if="filteredOutput.length === 0 && searchTerm && output.length > 0" class="text-gray-400 italic text-center mt-4">
          No results found for "{{ searchTerm }}"
        </div>
      </div>
    </div>

    <!-- Full-screen Modal -->
    <div v-if="isFullScreen" class="fixed inset-0 bg-gray-900 z-50 flex flex-col p-4 overflow-hidden">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-white">Output</h2>
        <div class="flex items-center gap-2">
          <div class="relative">
            <input
              type="text"
              v-model="searchTerm"
              placeholder="Search output..."
              class="px-3 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 bg-gray-800 text-white border-gray-700"
            />
            <button
              v-if="searchTerm"
              @click="searchTerm = ''"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              ×
            </button>
          </div>
          <button
            @click="toggleFullScreen"
            class="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded flex items-center"
            title="Exit full-screen mode"
          >
            ⤓
          </button>
          <button
            @click="$emit('clear')"
            class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
            :disabled="output.length === 0"
            :class="{ 'opacity-50 cursor-not-allowed': output.length === 0 }"
          >
            Clear
          </button>
        </div>
      </div>
      <div ref="fullScreenContainer" class="text-white p-4 rounded font-mono flex-grow overflow-y-auto whitespace-pre-wrap leading-relaxed text-sm w-full">
        <div
          v-for="(line, index) in filteredOutput"
          :key="index"
          class="mb-2"
        >
          <div class="flex items-start">
            <span class="text-xs text-gray-500 mr-2 whitespace-nowrap">{{ line.timestamp || '' }}</span>
            <div :class="lineClass(line)" v-html="formatOutputWithHighlight(line.data)"></div>
          </div>
        </div>
        <div v-if="filteredOutput.length === 0 && searchTerm && output.length > 0" class="text-gray-400 italic text-center mt-4">
          No results found for "{{ searchTerm }}"
        </div>
      </div>
    </div>
  `,
  setup(props) {
    const outputContainer = ref(null);
    const fullScreenContainer = ref(null);
    const searchTerm = ref('');

    // Computed property to filter output based on search term
    const filteredOutput = computed(() => {
      if (!searchTerm.value) return props.output;

      return props.output.filter(line => {
        if (!line.data) return false;
        return line.data.toLowerCase().includes(searchTerm.value.toLowerCase());
      });
    });

    // Watch for changes to the output array and scroll to bottom
    watch(() => props.output.length, async () => {
      if (outputContainer.value) {
        // Wait for the DOM to update before scrolling
        await nextTick();
        outputContainer.value.scrollTop = outputContainer.value.scrollHeight;
      }

      if (fullScreenContainer.value) {
        await nextTick();
        fullScreenContainer.value.scrollTop = fullScreenContainer.value.scrollHeight;
      }
    });

    return {
      outputContainer,
      fullScreenContainer,
      searchTerm,
      filteredOutput
    };
  },
  mounted() {
    // Add ESC key handler for exiting full-screen mode
    document.addEventListener('keydown', this.handleKeyDown);
  },
  unmounted() {
    // Clean up the event listener
    document.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    handleKeyDown(event) {
      if (event.key === 'Escape' && this.isFullScreen) {
        this.toggleFullScreen();
      }
    },
    toggleFullScreen() {
      this.isFullScreen = !this.isFullScreen;

      // When entering full-screen, we need to wait for the DOM to update
      // before scrolling to the bottom in the full-screen container
      if (this.isFullScreen) {
        nextTick(() => {
          if (this.$refs.fullScreenContainer) {
            this.$refs.fullScreenContainer.scrollTop = this.$refs.fullScreenContainer.scrollHeight;
          }
        });
      }
    },
    lineClass(line) {
      return {
        'text-red-400': line.type === 'error',
        'text-green-400': line.type === 'exit',
        'text-white': line.type === 'output'
      };
    },
    formatOutput(text) {
      if (!text) return '';

      // Escape HTML to prevent XSS
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      // Replace newlines with <br> tags
      return escaped.replace(/\n/g, '<br>');
    },

    formatOutputWithHighlight(text) {
      if (!text) return '';
      if (!this.searchTerm) return this.formatOutput(text);

      // Escape HTML to prevent XSS
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      // Replace newlines with <br> tags
      const withLineBreaks = escaped.replace(/\n/g, '<br>');

      // If no search term, return the formatted text
      if (!this.searchTerm) return withLineBreaks;

      // Highlight the search term (case-insensitive)
      const searchRegex = new RegExp(this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return withLineBreaks.replace(searchRegex, match => `<span class="bg-yellow-300 text-black px-0.5 rounded">${match}</span>`);
    }
  }
};