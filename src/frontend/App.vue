<template lang="pug">
  #app
    section.hero.is-primary
      .hero-head
        .container
          nav.nav
            .nav-left
              router-link.nav-item(:to="'/'")
                span もののけリモコン
    router-view
    footer.footer
      .container
        .content.has-text-centered
</template>

<script>
export default {
  name: 'App'
}
</script>