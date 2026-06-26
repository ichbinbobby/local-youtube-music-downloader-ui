<script setup lang="ts">
interface TrackEntry {
  title: string
  url?: string
  duration?: number
}

interface VideoInfo {
  _type?: string
  title: string
  uploader?: string
  channel?: string
  thumbnail?: string
  album?: string
  artist?: string
  track?: string
  entries?: TrackEntry[]
  playlist_count?: number
}

const url = ref('')
const outputPath = ref('')
const isLoadingInfo = ref(false)
const info = ref<VideoInfo | null>(null)
const infoError = ref('')
const isDownloading = ref(false)
const downloadStatus = ref<'idle' | 'running' | 'done' | 'error'>('idle')
const progressLines = ref<string[]>([])
const progressContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  outputPath.value = localStorage.getItem('musicOutputPath') ?? ''
})

watch(outputPath, (val) => {
  localStorage.setItem('musicOutputPath', val)
})

async function fetchInfo() {
  const trimmed = url.value.trim()
  if (!trimmed) return

  isLoadingInfo.value = true
  infoError.value = ''
  info.value = null
  downloadStatus.value = 'idle'
  progressLines.value = []

  try {
    const data = await $fetch<VideoInfo>('/api/info', { query: { url: trimmed } })
    info.value = data
  }
  catch (err: unknown) {
    infoError.value = errorMessage(err, 'Failed to fetch info')
  }
  finally {
    isLoadingInfo.value = false
  }
}

async function startDownload() {
  if (!info.value) return

  isDownloading.value = true
  downloadStatus.value = 'running'
  progressLines.value = []

  try {
    const { jobId } = await $fetch<{ jobId: string }>('/api/download', {
      method: 'POST',
      body: { url: url.value.trim(), outputPath: outputPath.value, isPlaylist: isPlaylist.value }
    })

    const es = new EventSource(`/api/progress/${jobId}`)

    es.onmessage = (e) => {
      progressLines.value.push(e.data)
      nextTick(() => {
        if (progressContainer.value) {
          progressContainer.value.scrollTop = progressContainer.value.scrollHeight
        }
      })
    }

    es.addEventListener('done', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      downloadStatus.value = data.success ? 'done' : 'error'
      isDownloading.value = false
      es.close()
    })

    es.onerror = () => {
      if (downloadStatus.value === 'running') {
        downloadStatus.value = 'error'
        isDownloading.value = false
      }
      es.close()
    }
  }
  catch (err: unknown) {
    progressLines.value.push(`Error: ${errorMessage(err, 'Download failed')}`)
    downloadStatus.value = 'error'
    isDownloading.value = false
  }
}

function reset() {
  url.value = ''
  info.value = null
  infoError.value = ''
  downloadStatus.value = 'idle'
  progressLines.value = []
}

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (typeof e.data === 'object' && e.data && typeof (e.data as Record<string, unknown>).message === 'string') {
      return (e.data as Record<string, unknown>).message as string
    }
    if (typeof e.message === 'string') return e.message
  }
  return fallback
}

const isPlaylist = computed(() => info.value?._type === 'playlist')
const trackCount = computed(() => info.value?.playlist_count ?? info.value?.entries?.length ?? 0)
const artistName = computed(() => info.value?.artist ?? info.value?.uploader ?? info.value?.channel ?? '')
</script>

<template>
  <UContainer class="py-10 max-w-2xl mx-auto">
    <!-- URL Input Card -->
    <UCard class="mb-4">
      <div class="space-y-4">
        <div class="flex gap-2">
          <UInput
            v-model="url"
            placeholder="Paste YouTube or YouTube Music URL…"
            class="flex-1"
            :disabled="isLoadingInfo || isDownloading"
            @keyup.enter="fetchInfo"
          />
          <UButton
            :loading="isLoadingInfo"
            :disabled="!url.trim() || isDownloading"
            icon="i-lucide-search"
            @click="fetchInfo"
          >
            Get Info
          </UButton>
        </div>

        <UFormField label="Output folder">
          <UInput
            v-model="outputPath"
            placeholder="Leave empty to use ~/Music"
            class="w-full font-mono text-sm"
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Error -->
    <UAlert
      v-if="infoError"
      color="error"
      icon="i-lucide-circle-alert"
      :title="infoError"
      class="mb-4"
    />

    <!-- Info Preview -->
    <UCard v-if="info" class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted uppercase tracking-wider">
            {{ isPlaylist ? 'Playlist' : 'Track' }}
          </span>
          <UBadge v-if="isPlaylist" color="info" variant="subtle">
            {{ trackCount }} tracks
          </UBadge>
        </div>
      </template>

      <div class="flex gap-4">
        <img
          v-if="info.thumbnail"
          :src="info.thumbnail"
          :alt="info.title"
          class="w-20 h-20 object-cover rounded-lg shrink-0"
        />
        <div class="flex-1 min-w-0 space-y-0.5">
          <h2 class="font-semibold truncate leading-snug">{{ info.title }}</h2>
          <p v-if="artistName" class="text-sm text-muted">{{ artistName }}</p>
          <p v-if="info.album" class="text-sm text-muted italic">{{ info.album }}</p>
        </div>
      </div>

      <!-- Track list -->
      <div v-if="info.entries?.length" class="mt-4 border-t pt-3 max-h-52 overflow-y-auto space-y-1">
        <div
          v-for="(entry, i) in info.entries"
          :key="i"
          class="flex gap-3 text-sm py-0.5 hover:bg-elevated/50 rounded px-1"
        >
          <span class="tabular-nums text-muted text-xs w-6 text-right shrink-0 pt-px">
            {{ String(i + 1).padStart(2, '0') }}
          </span>
          <span class="truncate">{{ entry.title }}</span>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            :loading="isDownloading"
            :disabled="isDownloading || downloadStatus === 'done'"
            :color="downloadStatus === 'done' ? 'success' : 'primary'"
            :icon="downloadStatus === 'done' ? 'i-lucide-check' : 'i-lucide-download'"
            @click="startDownload"
          >
            {{ downloadStatus === 'done'
              ? 'Downloaded!'
              : isPlaylist
                ? `Download ${trackCount} tracks`
                : 'Download' }}
          </UButton>
          <UButton variant="ghost" color="neutral" icon="i-lucide-rotate-ccw" @click="reset">
            Reset
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- Progress Terminal -->
    <UCard v-if="progressLines.length > 0 || isDownloading">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium text-sm">Progress</span>
          <UBadge
            :color="downloadStatus === 'done' ? 'success' : downloadStatus === 'error' ? 'error' : 'info'"
            variant="subtle"
          >
            {{ downloadStatus }}
          </UBadge>
        </div>
      </template>

      <div
        ref="progressContainer"
        class="bg-gray-950 dark:bg-black rounded-md p-3 h-56 overflow-y-auto font-mono text-xs leading-relaxed"
      >
        <div
          v-for="(line, i) in progressLines"
          :key="i"
          :class="[
            'whitespace-pre-wrap',
            line.startsWith('[download]') ? 'text-green-400' :
            line.startsWith('[ffmpeg]') || line.startsWith('[ExtractAudio]') || line.startsWith('[Metadata]') ? 'text-blue-400' :
            line.toUpperCase().startsWith('ERROR') ? 'text-red-400' :
            line.startsWith('[youtube') ? 'text-yellow-400' :
            'text-gray-300'
          ]"
        >{{ line }}</div>
        <span v-if="isDownloading" class="text-green-400 animate-pulse">▋</span>
      </div>
    </UCard>
  </UContainer>
</template>
