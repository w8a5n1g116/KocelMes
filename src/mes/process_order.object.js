const objectql = require('@steedos/objectql');

Creator.Objects.process_order.methods = {
    planReport: async function (req, res) {

      try{
        const params = req.params;
        const user = req.user;
        const steedosSchema = objectql.getSteedosSchema();
        var process_order = await steedosSchema.getObject('process_order').updateOne(params._id,{
          real_end_date:new Date(),
          process_order_status:'2'
        });       
        let id = params._id;
        res.status(200).send({id});
     
      } catch (error) {
        res.status(400).send({
          'error': {
            'details': error.stack,
            'message': error.message,
          }
        });
      }
    }
};

Creator.Objects.process_order.actions = {
    planReport: {
      label: "计划汇报",
      visible: function (object_name, record_id, record_permissions) {        
        return true;
      },
      on: "record",
      todo: function (object_name, record_id, fields) {
        $("body").addClass("loading");
        var userSession = Creator.USER_CONTEXT;
        var authorization = "Bearer " + userSession.spaceId + "," + userSession.user.authToken;
        $.ajax({
          type: "POST",
          url: Meteor.absoluteUrl("/api/odata/v4/" + userSession.spaceId + "/process_order/" + record_id + "/planReport"),
          data: JSON.stringify({}),
          dataType: "json",
          contentType: 'application/json',
          beforeSend: function (XHR) {
            XHR.setRequestHeader('Content-Type', 'application/json');
            XHR.setRequestHeader('Authorization', authorization);
          },
          success: function (data) {
            $("body").removeClass("loading");
            toastr.success("已成功调用");
          },
          error: function (XMLHttpRequest, textStatus, errorThrown) {
            $("body").removeClass("loading");
            toastr.error("调用失败："+ errorThrown);
          }
        });
      },
  }
}