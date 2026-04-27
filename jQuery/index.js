// $(document).ready(function(){
//     $("h1").css("color","red");
// });     This code when we place jQuery CDN just before closing head tag instead of closing body tag.

//$("h1").css("color","green");

//$("h1").addClass("big-title margin-50"); // Use space between classes to add more than one class from CSS file.

//$("h1").text("Bye")

//$("button").text("Don't Click Me");

//$("button").html("<em>Hey</em>")

//console.log($("img").attr("src"));                      //getting the attribute of src in image tag.

//$("a").attr("href","https://www.yahoo.com")             // set/change the attribute to https://www.yahoo.com


                                      // Event Listeners in jQuery.....

//  In JS-> document.querySelector.addEventListener("click",function(){   document.querySelector("h1").style.color = "purple";       });
/*
$("h1").click(function(){
    $("h1").css("color","purple");
});    */

//In JS-> for(var i=0; i<5; i++){ document.querySelectorAll("button")[i].addEventListener("click",function(){  document.querySelector("h1").style.color = "purple"; }); }

/*
$("button").click(function(){
    $("h1").css("color","purple");
});    */
/*
$(document).keypress(function(event){
    $("h1").text(event.key);
});  */

// Another method for event listener. Takes two parameter- .on(event, callback)

// $("h1").on("mouseover",function(){
//     $("h1").css("color","purple");
// });

                                        // Adding and Deleting elements with jQuery

//$("h1").before("<button>New</button>");  // This creates a button titled "New" before h1 tag.( before, after ).
//$("h1").prepend("<button>New</button>");   // This creates a button titled "New" inside h1 tag but before text(content) and after opening tag. (prepend, append).
//$("button").remove();     //This removes all the button element present in web page.    

                                        // Website Animation with jQuery

// $("button").on("click",function(){
//     $("h1").slideToggle();                       // methods-> hide(),show(),toggle(),fadeOut(),fadeIn(),fadeToggle(),slideUp(),slideDown(), slideToggle()
// });

// $("button").on("click",function(){
//     $("h1").animate({margin: "20px"});          // For animate() method, property like color don't work. So, we need to stick to numerical changes like margin, width, height,....
// });   

$("button").on("click",function(){
    $("h1").slideUp().slideDown().animate({opacity: 0.5});          // We can chain multiple method for animation
});   