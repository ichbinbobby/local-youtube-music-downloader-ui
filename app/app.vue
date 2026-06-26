<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'Music Downloader',
  description: 'Download YouTube music as MP3 with full metadata'
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-music-2" class="w-5 h-5 text-primary" />
          <span class="font-semibold tracking-tight">Music Downloader</span>
        </div>
      </template>

      <template #right>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
