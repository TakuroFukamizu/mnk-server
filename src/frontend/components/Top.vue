<template lang="pug">
    section.section
        template(v-if="hasError")
            .columns
                .column.is-10.is-offset-1
                    div(style="margin-left:auto; margin-right:auto;") {{message}}
        
        .columns.is-mobile.is-multiline
            .column.is-one-third-desktop.is-full-mobile
                section.panel
                    p.panel-heading 再生関連
                    .panel-block
                        button.button.is-primary(v-on:click="play") PLAY
                    .panel-block
                        button.button.is-primary(v-on:click="pause") PAUSE
                    .panel-block
                        button.button.is-primary(v-on:click="reset") RESET
            .column.is-one-third-desktop.is-full-mobile
                section.panel
                    p.panel-heading 保守
                    .panel-block
                        button.button.is-primary(v-on:click="loadSeq") LOAD SEQUENCE
                    .panel-block
                        button.button.is-primary(v-on:click="frontOff") FRONT ON/OFF
                    .panel-block
                        button.button.is-primary(v-on:click="rearOff") REAR ON/OFF
</template>

<script>
import playerCommand from 'mixins/playerCommand';
import maintCommand from 'mixins/maintCommand';
export default {
    name: 'Player',
    mixins: [playerCommand, maintCommand],
    data () {
        return {
            message: null,
            hasError: false
        }
    },
    methods: {
        checkStatus: function() {
            this.maintCommandCheckStatus().then((status) => {
                alert(status);
            }).catch((e) => {
                this.hasError = true;
                this.message = e;
            });
        },
        frontOff: function() {
            this.maintCommandFrontOff().then(() => {
                alert("OK");
            }).catch((e) => {
                this.hasError = true;
                this.message = e;
            });
        },
        rearOff: function() {
            this.maintCommandRearOff().then(() => {
                alert("OK");
            }).catch((e) => {
                this.hasError = true;
                this.message = e;
            });
        },
        loadSeq: function() {
            this.maintCommandLoadSeq().then(() => {
                alert("OK");
            }).catch((e) => {
                this.hasError = true;
                this.message = e;
            });
        },
        play: function() {
            this.playerCommandPlay().then(() => {
                alert("OK");
            }).catch((e) => {
                this.hasError = true;
                this.message = e;
            });
        },
        pause: function() {
            this.playerCommandPause().then(() => {
                alert("OK");
            }).catch((e) => {
                this.hasError = true;
                this.message = e;
            });
        },
        reset: function() {
            this.playerCommandReset().then(() => {
                alert("OK");
            }).catch((e) => {
                this.hasError = true;
                this.message = e;
            });
        }
    }
}
</script>
