import { ref, onMounted, computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export default {
  name: 'ScriptList',
  emits: ['script-selected'],
  template: `
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Available Scripts</h2>

      <!-- Sources and Scripts -->
      <div v-if="sources.length > 0" class="space-y-6">
        <div v-for="source in sources" :key="source.id" class="border rounded-lg p-4">
          <h3 class="font-medium text-lg mb-3">{{ source.name }}</h3>

          <!-- Upload UI for each source -->
          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 text-center hover:border-gray-400 transition-colors"
            :class="{ 'border-blue-500 bg-blue-50': isDragging === source.id }"
            @dragover.prevent="handleDragOver($event, source.id)"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop($event, source.id)"
          >
            <input
              type="file"
              :ref="'fileInput-' + source.id"
              @change="(event) => handleFileSelect(event, source.id)"
              accept=".js,.sh,.ts"
              class="hidden"
              multiple
            >
            <button
              @click="$refs['fileInput-' + source.id][0].click()"
              class="btn btn-primary mb-2"
            >
              Choose Files
            </button>
            <p class="text-sm text-gray-600">or drag and drop script files here</p>
          </div>

          <!-- Scripts for this source -->
          <div v-if="scriptsBySource[source.id] && scriptsBySource[source.id].length > 0" class="space-y-2">
            <div
              v-for="script in scriptsBySource[source.id]"
              :key="script.name"
              class="flex items-center gap-2"
            >
              <button
                @click="selectScript(script)"
                class="flex-grow text-left px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                {{ script.name }}
              </button>
              <button
                @click="confirmDelete(script)"
                class="px-2 py-2 rounded text-red-600 hover:bg-red-100"
                title="Delete script"
              >
                ×
              </button>
            </div>
          </div>
          <div v-else class="text-gray-500 text-sm italic">
            No scripts in this source
          </div>
        </div>
      </div>
      <div v-else class="text-gray-500 text-center py-4">
        No sources configured. Please add sources in the Sources tab.
      </div>
    </div>
  `,
  setup(props, { emit }) {
    const scripts = ref([]);
    const sources = ref([]);
    const isDragging = ref(null); // Will hold the source ID that's being dragged over

    // Computed property to group scripts by source
    const scriptsBySource = computed(() => {
      const grouped = {};

      // Initialize with empty arrays for all sources
      sources.value.forEach(source => {
        grouped[source.id] = [];
      });

      // Group scripts by source ID
      scripts.value.forEach(script => {
        if (script.source && script.source.id) {
          if (!grouped[script.source.id]) {
            grouped[script.source.id] = [];
          }
          grouped[script.source.id].push(script);
        }
      });

      return grouped;
    });

    // Fetch sources
    const fetchSources = async () => {
      try {
        const response = await fetch(window.location.origin+'/api/sources');
        sources.value = await response.json();
      } catch (error) {
        console.error('Failed to fetch sources:', error);
      }
    };

    // Fetch scripts
    const fetchScripts = async () => {
      try {
        const response = await fetch(window.location.origin+'/api/scripts');
        scripts.value = await response.json();
      } catch (error) {
        console.error('Failed to fetch scripts:', error);
      }
    };

    // Upload files to a specific source
    const uploadFiles = async (files, sourceId) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append('scripts', file);
      }

      try {
        const response = await fetch(window.location.origin+`/api/scripts/upload?sourceId=${sourceId}`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          await fetchScripts(); // Refresh the list
        } else {
          console.error('Upload failed:', await response.text());
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    };

    // Delete a script
    const deleteScript = async (script) => {
      try {
        const response = await fetch(
          window.location.origin+`/api/scripts/${encodeURIComponent(script.name)}?sourceId=${script.source.id}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          await fetchScripts(); // Refresh the list
        } else {
          console.error('Delete failed:', await response.text());
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    };

    // Confirm script deletion
    const confirmDelete = (script) => {
      if (confirm(`Are you sure you want to delete "${script.name}" from source "${script.source.name}"?`)) {
        deleteScript(script);
      }
    };

    // Handle file selection for a specific source
    const handleFileSelect = (event, sourceId) => {
      const files = event.target.files;
      if (files.length > 0) {
        uploadFiles(files, sourceId);
      }
    };

    // Handle drag over for a specific source
    const handleDragOver = (event, sourceId) => {
      event.preventDefault();
      isDragging.value = sourceId;
    };

    // Handle drag leave
    const handleDragLeave = (event) => {
      event.preventDefault();
      isDragging.value = null;
    };

    // Handle drop for a specific source
    const handleDrop = (event, sourceId) => {
      event.preventDefault();
      isDragging.value = null;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        uploadFiles(files, sourceId);
      }
    };

    // Select a script
    const selectScript = (script) => {
      emit('script-selected', script.name);
    };

    // Initialize
    onMounted(async () => {
      await fetchSources();
      await fetchScripts();
    });

    return {
      scripts,
      sources,
      scriptsBySource,
      isDragging,
      handleFileSelect,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      confirmDelete,
      selectScript
    };
  }
};