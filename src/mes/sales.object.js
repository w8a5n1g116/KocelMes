const objectql = require('@steedos/objectql');

function createNo(bit,no){
  let sno = new String(no);
  let len = sno.length;

  let zero_count = bit - len;

  let zero_string = '';

  for(let i =0;i<zero_count;i++){
    zero_string += '0';
  }

  return zero_string + sno;
}

Creator.Objects.sales.methods = {
    transformProductOrder: async function (req, res) {

      try{
        const params = req.params;
        const user = req.user;
        const steedosSchema = objectql.getSteedosSchema();
        var sales = await steedosSchema.getObject('sales').findOne(params._id);
        var product_order_count = await steedosSchema.getObject('product_order').count({});
        var product_order = await steedosSchema.getObject('product_order').insert({
            name:'PRO_' + createNo(8,product_order_count + 1),
            sales:sales._id,
            producting_count:sales.sales_count,
            inhouse_count:0,
            order_status:'1',
            delivery_status:'1',
            remark:'',
            owner:user.userId,
            space:user.spaceId
        });

        let product = await steedosSchema.getObject('product').findOne(sales.product);

        let versions = await steedosSchema.getObject('technology_info').find({filters: [['product', '=', product._id]]});

        let product_sub_orders = await steedosSchema.getObject('product_sub_order');
        let process_orders = await steedosSchema.getObject('process_order');
        let quality_param_reports = await steedosSchema.getObject('quality_param_report');

        let product_sub_order_count = await steedosSchema.getObject('product_sub_order').count({});

        for(let i = 0;i < sales.sales_count;i++){
          let product_sub_order = await product_sub_orders.insert({
            name:'PSO_' + createNo(8,product_sub_order_count + i + 1),
            product_order:product_order._id,
            casting_no:'CS_' + createNo(8,product_sub_order_count + i + 1),
            letest_process:versions[0].process[0],
            sub_order_status:'1',
            remark:'',
            owner:user.userId,
            space:user.spaceId
          });

          let process_order_count = await steedosSchema.getObject('process_order').count({});

          for(let j = 0;j < versions[0].process.length;j++){
            let process_order = await process_orders.insert({
              name:'PCO_' + createNo(8,process_order_count + j + 1),
              product_sub_order:product_sub_order._id,
              standard_process:versions[0].process[j],
              plan_start_date: new Date(),
              plan_end_date:new Date(),
              real_end_date:null,
              process_order_status:'1',
              remark:'',
              owner:user.userId,
              space:user.spaceId
            });

            let quality_params = await steedosSchema.getObject('quality_param').find({filters: [['process_info', '=', versions[0].process[j]]]});
            for(let k = 0;k < quality_params.length;k++){
              let quality_param_report = await quality_param_reports.insert({
                process_order:process_order._id,
                quality_param:quality_params[k]._id,
                param_name:quality_params[k].param_name,
                param_type:quality_params[k].param_type,
                pass_standard:quality_params[k].pass_standard,
                param_description:quality_params[k].param_description,
                max:quality_params[k].max,
                min:quality_params[k].min,
                check_standard:quality_params[k].check_standard,
                quality_result:'',
                unquality_type:'',
                remark:'',
                owner:user.userId,
                space:user.spaceId
              });
  
            }
          }
        }
        
        res.status(200).send({});
     
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

Creator.Objects.sales.actions = {
    transformProductOrder: {
      label: "转化生产订单",
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
          url: Meteor.absoluteUrl("/api/odata/v4/" + userSession.spaceId + "/sales/" + record_id + "/transformProductOrder"),
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