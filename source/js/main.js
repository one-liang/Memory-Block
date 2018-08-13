console.clear()
// ----------
// 方塊物件
// ----------
var blockData = [
  {selector: ".block1", name: "1", pitch: "1"},
  {selector: ".block2", name: "2", pitch: "2"},
  {selector: ".block3", name: "3", pitch: "3"},
  {selector: ".block4", name: "4", pitch: "4"},
]
var soundSetData = [
  {name: "correct", sets: [1,3,5,8]},
  {name: "wrong", sets: [2,4,5.5,7]},  
]
var levelDatas = [
  "123",
  "1234",
  "12324",
  "321242",
  "2341231",
  "31241321"
]
// var resultSets = soundSetData[0].sets.map(function(pitch){
//   return this.getAudioObject(pitch)
// })
// 方塊資料 遊戲特效
var Blocks = function(blockAssign, setAssign){
  // 全點亮
  this.allOn = false
  // data=d, index=i, 抓$(selector)物件
  this.blocks = blockAssign.map((d,i)=>{
    return{
      name: d.name,
      el: $(d.selector),
      audio: this.getAudioObject(d.pitch)
    }
  })
  this.soundSets = setAssign.map((d,i)=>{
    return{
      name: d.name,
      sets: d.sets.map((pitch)=>{
        return this.getAudioObject(pitch)
      })
    }
  })
}
// 閃爍單一方塊＋聲音(方塊名)
Blocks.prototype.flash = function(note){
  let block = this.blocks.find(d=>d.name==note)
  if(block){
    block.audio.currentTime = 0
    block.audio.play()
    block.el.addClass("active")
    setTimeout(()=>{
      if(this.allOn==false){
        block.el.removeClass("active")
      }
    },100)
  }
}
// 開啟所有方塊
Blocks.prototype.turnAllOn = function(){
  this.allOn = true
  this.blocks.forEach((block)=>{
    block.el.addClass("active")
  })
}
// 關掉所有方塊
Blocks.prototype.turnAllOff = function(){
  this.allOn = false
  this.blocks.forEach((block)=>{
    block.el.removeClass("active")
  })
}
// 取得聲音物件
Blocks.prototype.getAudioObject = function(pitch){
  return new Audio("https://awiclass.monoame.com/pianosound/set/"+pitch+".wav")
}
// 播放序列聲音（成功/失敗...）
Blocks.prototype.playSet = function(type){
  // 聲音的名字
  let sets = this.soundSets.find(set=>set.name==type).sets
  sets.forEach((obj)=>{
    obj.currentTime = 0
    obj.play()
  })
}
// var blocks = new Blocks(blockData, soundSetData)

// ----------
// 遊戲物件
// ----------
var Game = function(){
  this.blocks = new Blocks(blockData, soundSetData)
  this.levels = levelDatas
  // 關卡從0開始
  this.currentLevel = 0
  // 播放間隔
  this.playInterval = 400
  // 關卡狀態
  this.mode = "waiting"
}

// Ajax
// 不要偷看答案
Game.prototype.loadLevels = function(){
  let _this = this
  $.ajax({
    url: "https://2017.awiclass.monoame.com/api/demo/memorygame/leveldata",
    success: function(res){
      _this.levels = res
    }
  })
}
         
Game.prototype.startLevel = function(){
  this.showMessage("Level " + this.currentLevel)
  let levelData = this.levels[this.currentLevel]
  this.startGame(levelData)
}
Game.prototype.showMessage = function(mes){
  console.log(mes)
  $(".status").text(mes)
}
// 開始出題
Game.prototype.startGame = function(answer){
  this.mode = "gamePlay"
  // 存取答案
  this.answer = answer
  // 一個個音符播放
  let notes = this.answer.split("")
  this.showStatus("")
  // 如果沒有長度會把計時器關掉，要把計時器存起來
  this.timer = setInterval(()=>{
    // char=取出來的數字
    let char = notes.shift()
    // console.log(char)
    this.playNote(char)
    // !notes.length 意思一樣
    if(notes.length==0){
      // console.log("audio play end")
      this.startUserInput()
      clearInterval(this.timer)
    }
  },this.playInterval)
}
Game.prototype.playNote = function(note){
  console.log(note)
  this.blocks.flash(note)
}

// 開始輸入模式
Game.prototype.startUserInput = function(){
  // 暫存使用者輸入的變數
  this.userInput = ""
  // 切換給使用者
  this.mode = "userInput"
}
// 比對使用者輸入答案
Game.prototype.userSendInput = function(inputChar){
  // 現在是不是使用者輸入模式
  if(this.mode=="userInput"){
    // 使用者輸入的集合
    let tempString = this.userInput + inputChar
    this.playNote(inputChar)
    this.showStatus(tempString)
    if(this.answer.indexOf(tempString)==0){
      console.log("good")
      if(this.answer==tempString){
        this.showMessage("Correct")
        this.currentLevel+=1
        this.mode = "waiting"
        setTimeout(()=>{
          this.startLevel()
        },1000)
        // console.log("correct")
      }
    } else{
        this.showMessage("Wrong")
        this.currentLevel=0
        this.mode = "waiting"
        setTimeout(()=>{
          this.startLevel()
        },1000)
        // console.log("wrong")
        // this.startGame("1234")
    }
    console.log(tempString)
    this.userInput+=inputChar
  }
}
Game.prototype.showStatus = function(tempString){
  $(".inputStatus").html("")
  this.answer.split("").forEach((d,i)=>{
    var circle = $("<div class='circle'></div>")
    if(i<tempString.length){
      circle.addClass("correct")
    }
    $(".inputStatus").append(circle)
  })
  if(tempString==""){
    this.blocks.turnAllOff()
  }
  if(tempString==this.answer){
    $(".inputStatus").addClass("correct")
    setTimeout(()=>{
      this.blocks.turnAllOn()
      this.blocks.playSet("correct")
    },500)
  }else{
    $(".inputStatus").removeClass("correct")
  }
  if(this.answer.indexOf(tempString)!=0){
    $(".inputStatus").addClass("wrong")
    setTimeout(()=>{
      this.blocks.turnAllOn()
      this.blocks.playSet("wrong")
    },500)
  }else{
    $(".inputStatus").removeClass("wrong")
  }
}
var game = new Game()
// game.startGame("1234")

// 用遠端資料
game.loadLevels()

// 開始遊戲
setTimeout(()=>{
  game.startLevel()
},1000)
