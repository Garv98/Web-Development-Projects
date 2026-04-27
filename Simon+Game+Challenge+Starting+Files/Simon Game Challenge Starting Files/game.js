var buttonColours = ["red","blue","green","yellow"];
var gamePattern = [];
var userChosenPattern = [];
var level = 0;
var started = false;

$(document).on("keydown",function(){
    if (started===false){
        nextSequence();
        started = true;
    }
});

function nextSequence(){
    userChosenPattern=[];
    level += 1;
    $("#level-title").text("Level " + level); 
    var randomNumber = Math.floor(Math.random()*4);
    var randomChosenColour = buttonColours[randomNumber];   
    gamePattern.push(randomChosenColour);

    $("#" + randomChosenColour).fadeIn(100).fadeOut(100).fadeIn(100);
    playSound(randomChosenColour);
}

function startOver(){
    gamePattern = [];
    level = 0;
    started = false;
}

$(".btn").on("click",function(){
    var userChosenColour = $(this).attr("id");
    playSound(userChosenColour);
    userChosenPattern.push(userChosenColour);
    animatePress(userChosenColour);
    checkAnswer((userChosenPattern.length)-1);
})

function checkAnswer(currentLevel){
    if(userChosenPattern[currentLevel] == gamePattern[currentLevel])
    {
        if(userChosenPattern.length === gamePattern.length)
        {
            setTimeout(function(){
                nextSequence();
            }, 1000);
        }
    }
    else{
        var wrongSound = new Audio("sounds/wrong.mp3");
        wrongSound.play();
        $("body").addClass("game-over");
        setTimeout(function(){
            $("body").removeClass("game-over");
        },200);
        $("#level-title").text("Game Over, Press Any Key to Restart");
        startOver();
    }
}


function animatePress(currentColour){
    $("#"+currentColour).addClass("pressed");

    setTimeout(function(){
        $("#"+currentColour).removeClass("pressed");
    }, 100);
}

function playSound(name){
    var sound = new Audio("sounds/"+name+".mp3");
    sound.play();
}   