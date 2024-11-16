function addToCart(productId) {
  $.ajax({
    url: "/add-to-cart/" + productId,
    method: "get",
    success: (response) => {
      if (response.status) {
        let count = $("#cartCount").html();
        count = parseInt(count) + 1;
        $("#cartCount").html(count);

        // Remove any existing alert before appending a new one
        $(".alert").remove();

        let alert = $(
          '<div class="alert alert-success alert-dismissible fade show" role="alert"> Item Added to Cart! <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'
        );
        $("#alerts").append(alert);
        setTimeout(() => {
          alert.fadeOut(500, function () {
            $(this).remove(); // Remove the alert element after fading out
          });
        }, 2000);
        
      }
    },
  });
}


   function addToWishlist(productId) {
     $.ajax({
       url: "/add-to-wishlist/" + productId,
       method: "get",
       success: (response) => {
         if (response.status) {
           let count = $("#wishlistCount").html();
           count = parseInt(count) + 1;
           $("#wishlistCount").html(count);
           if(response.isOnCart){
            swal("Item is Already on Cart!", "Item cannot add if it is on cart!");
           }else if(response.isOnWishlist){
            swal("Item is Already on Wishlist!", "Item cannot add if it is on wishlist!");
           }else{
            swal("item Added!", "It is now on wishlist!", "success");
           }
         }
       },
     });
   }