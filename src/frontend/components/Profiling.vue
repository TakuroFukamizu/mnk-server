<template lang="pug">
  section.section
    .columns
      .column.is-4.is-offset-4
        .field.has-addons
          p.control.is-expanded.has-icons-left
            input.input(v-model="query" type="text" placeholder="アカウント名" @keyup.enter="searchUser" v-on:click="showHistory")
            span.icon.is-small.is-left
              i.fa.fa-instagram 
          p.control
            button.button.is-primary(v-on:click="searchUser") 判定
              // i.fa.fa-check 判定
          // p.help This username is available
        .profiling-history(v-if="isShowHistory")
          table
            tr(v-for="item in history")
              td(v-on:click="selectHistory(item)") {{item}}
    template(v-if="isFirstShow")
      .columns
        .column.is-10.is-offset-1
          div(style="margin-left:auto; margin-right:auto;") 指定したInstagramアカウントをプロファイリングします
    template(v-if="isLoading")
      .columns
        .column.is-10.is-offset-1
          p プロファイリングしています...
          div.sk-folding-cube
            .sk-cube1.sk-cube
            .sk-cube2.sk-cube
            .sk-cube4.sk-cube
            .sk-cube3.sk-cube
          // mdl-progress(indeterminate)
    template(v-if="isFailed")
      .columns
        .column.is-10.is-offset-1
          .message.is-danger
            .message-body {{ message }}
    template(v-if="isLoaded")
      .columns
        .column.is-half.is-offset-1
          h3.title あなたのアカウント
          .columns
            .column.is-3.is-offset-1
              img(:src="resultUserProfile.profile_picture" width="100%" height="100%")
            .column.is-auto.is-offset-1
              span {{resultUserProfile.full_name}} ({{resultGen.name}})
              a(:href="resultGen.insta_url" target="_blank")
                i.fa.fa-instagram 
      .columns.is-mobile.is-multiline
        .column.is-one-third-desktop.is-full-mobile
          section.panel
            p.panel-heading 年齢・性別判定
            .panel-block
              .image.is-128x128.is-fullwidth(style="height:160px;")
                img(:src="resultGen.avatar_url")
            .panel-block
              p 
                span top match : 
                span(style="font-weight: bold; font-size: 1.5em;") {{resultGen.top.class_label}} {{parsePercent(resultGen.top.result)}}
        .column.is-one-third-desktop.is-full-mobile
          section.panel
            p.panel-heading ハッシュタグ作文
            .panel-block
              p 
                span ハッシュタグ作文率 : 
                span(style="font-weight: bold; font-size: 1.5em;") {{parsePercent(resultHts.percent)}}
            .panel-block(v-for="post in resultHtsItems" v-if="post.tag_sakubun")
              span.panel-icon
                i.fa.fa-commenting
              p.content
                span(v-for="tag in post.tags") &#035;{{tag.name}} 
        .column.is-one-third-desktop.is-full-mobile
          section.panel
            p.panel-heading 投稿写真の種類
            template(v-if="isPhotoKindLoaded")
              .panel-block
                photo-kind-chart.content(:data="resultPhotoKind")
              .panel-block(v-for="item in resultPhotoKindItems")
                .image.is-32x32
                  a(:href="item.url" target="_blank")
                    img(:src="item.url")
                span(style="padding-left: 10px; line-height:1.5em;") {{item.disp_label}} : {{parsePercent(item.predict)}}
            template(v-else)
              .panel-block
                .content(style="width:100%;")
                  p loading...
                  div.spinner(style="margin-left:auto; margin-right:auto;")
                    .rect1
                    .rect2
                    .rect3
                    .rect4
                    .rect5
</template>

<script>
// TODO: Instagramから顔写真取得
// TODO: 年齢性別判定の結果表示
// TODO: ハッシュタグ作文率の表示
// TODO: Kind of Photoの内訳表示
// TODO: フォロワーの年齢性別

import photoKindChart from './PhotoKindChart';

import mixinUserProfile from 'mixins/userProfile';
import mixinGeneration from 'mixins/generation';
import mixinAnalyzeCaption from 'mixins/analyzeCaption';
import mixinPhotoKind from 'mixins/photoKind';

import misinSafeUsers from 'mixins/safeUsers';

const LS_HISTORY = 'profiling.history';

export default {
    name: 'Profiling',
    components: {
        photoKindChart
    },
    mixins: [mixinUserProfile, mixinGeneration, mixinAnalyzeCaption, mixinPhotoKind, misinSafeUsers],
    data () {
        return {
            query: '',
            message: '',
            history: null,
            safeUsers: null,
            isShowHistory: false,
            resultUserProfile: null,
            resultGen: null,
            resultHts: null,
            resultHtsItems: null,
            resultPhotoKind: null,
            resultPhotoKindItems: null,
            dispItemSize: 8,
            isFirstShow: true,
            isLoading: false,
            isLoaded: false,
            isFailed: false,
            isPhotoKindLoaded: false
        }
    },
    created: function() {
        console.log('created2');
    },
    mounted: function() {
        console.log('mounted');
        this.history = JSON.parse(this.$localStorage.get(LS_HISTORY, "[]")); // load history
        console.log('loaded history', this.history);
        this.loadSafeUsers(); // load safe users
    },
    methods: {
        loadSafeUsers: function() {
            this.getSafeUsers().then((list)=>{
                console.log('getSafeUsers', list);
                if (list.length > 0) {
                    let history = list.concat(this.history);
                    this.history = history.filter((x, i, a) => a.indexOf(x) === i );
                    this.safeUsers = list;
                }
            }).catch((e) => {
                console.error(e);
            });
        },
        showHistory: function() {
            console.log('showHistory', this.history);
            this.isShowHistory = true;
        },
        selectHistory: function(item) {
            this.query = item;
            this.isShowHistory = false;
        },
        searchUser: function() {
            this.isShowHistory = false;
            this.isFirstShow = false;
            if (this.isLoading) return
            this.isLoaded = false;
            this.isFailed = false;
            let instaUserName = this.query;
            Promise.all([
                this.getInstUserProfile(instaUserName).then((profile) => {
                    this.resultUserProfile = profile;
                }),
                this.predict(instaUserName).then((item) => {
                    this.resultGen = item;
                }),
                this.hashtagSakubun(instaUserName).then((items) => {
                    this.resultHtsItems = items.slice(0, 10);
                    let tgsCount = 0;
                    for(let item of items) {
                        if (item.tag_sakubun) tgsCount++;
                    }
                    this.resultHts = {
                        percent: (tgsCount / items.length), //含有率
                        total: items.length, // 総件数 
                        tagSakubun: tgsCount // 作文件数
                    };
                }),
                // this.predictPhotoKinds(instaUserName).then((item) => {
                //     let filterdCounts = item.counts.filter((a) => a.count > 0);
                //     this.resultPhotoKind = {
                //         labels: filterdCounts.map((a) => a.disp_label),
                //         datasets: [
                //             {
                //             data: filterdCounts.map((a) => a.count)
                //             }
                //         ]
                //     };
                //     this.resultPhotoKindItems = item.items; //{'url', 'label', 'disp_label', 'predict'}
                // }),
            ]).then(() => {
                // update history
                let history = JSON.parse(this.$localStorage.get(LS_HISTORY, "[]"));
                history.push(instaUserName);
                history = history.filter((x, i, a) => a.indexOf(x) === i );
                this.$localStorage.set(LS_HISTORY, JSON.stringify(history));
                this.history = this.safeUsers.concat(history).filter((x, i, a) => a.indexOf(x) === i );
                // this.$nextTick(() => {
                    
                // });

                this.isLoading = false;
                this.isLoaded = true;
            }).catch((message) => {
                console.error(message);
                this.message = "アカウントの解析中にエラーが発生しました。アカウント名が正しいことと、非公開アカウントでないことをご確認ください。";
                this.isLoading = false;
                this.isFailed = true;
            });
            this.isLoading = true;
            
            // 写真の種別判定は遅いので別途ロードする
            this.isPhotoKindLoaded = false;
            let colors = [
              '#ff6633', '#ccff33', '#33ff66', '#33ccff', '#6633ff', '#ff33cc', 
              '#ffcc33', '#66ff33', '#33ffcc', '#3366ff', '#cc33ff', '#ff3366'
              ];
            this.resultPhotoKind = {
                  labels: ['セルフィー', '子供', 'コーデ', '食事', 'カフェ', '風景(田畑)'],
                  datasets: [
                      {
                          data: Array.from(Array(6).keys()).map((i) => 100 * Math.random() ),
                          backgroundColor: Array.from(Array(6).keys()).map((i) => '#cccccc' ),
                      }
                  ]
              };
            this.predictPhotoKinds(instaUserName).then((item) => {
                console.log('predictPhotoKinds result', item);
                let filterdCounts = item.counts.filter((a) => a.count > 0);
                let resultPhotoKind = {
                    labels: filterdCounts.map((a) => a.disp_label),
                    datasets: [
                        {
                          data: filterdCounts.map((a) => a.count),
                          backgroundColor: colors.slice(0, filterdCounts.length)
                        }
                    ]
                };
                this.resultPhotoKind = resultPhotoKind;
                this.resultPhotoKindItems = item.items; //{'url', 'label', 'disp_label', 'predict'}
                this.$nextTick(() => {
                    console.log('$nextTick', resultPhotoKind, item.items);
                    this.resultPhotoKind = resultPhotoKind;
                    this.resultPhotoKindItems = item.items; //{'url', 'label', 'disp_label', 'predict'}
                    // console.log(this.$el.textContent) // => 'updated'
                });
                this.isPhotoKindLoaded = true;
            }).catch((message) => {
                this.isPhotoKindLoaded = true;
                console.error(message);
            });
        },
        parsePercent: (value) => Math.round(value * 100) + '%'
    }
}
</script>
