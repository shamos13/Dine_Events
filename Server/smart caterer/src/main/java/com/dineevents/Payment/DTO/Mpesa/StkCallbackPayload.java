package com.dineevents.Payment.DTO.Mpesa;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

// Models Safaricom's actual callback shape:
// { "Body": { "stkCallback": { ..., "CallbackMetadata": { "Item": [ {Name, Value}, ... ] } } } }
// CallbackMetadata is only present when ResultCode == 0 (success).
@Data
public class StkCallbackPayload {

    @JsonProperty("Body")
    private CallbackBody body;

    @Data
    public static class CallbackBody {
        @JsonProperty("stkCallback")
        private StkCallback stkCallback;
    }

    @Data
    public static class StkCallback {
        @JsonProperty("MerchantRequestID")
        private String merchantRequestId;

        @JsonProperty("CheckoutRequestID")
        private String checkoutRequestId;

        // Daraja may send ResultCode as a number or a string ("0").
        @JsonProperty("ResultCode")
        private Object resultCode;

        @JsonProperty("ResultDesc")
        private String resultDesc;

        @JsonProperty("CallbackMetadata")
        private CallbackMetadata callbackMetadata;

        @JsonIgnore
        public Integer getResultCodeAsInt() {
            if (resultCode == null) {
                return null;
            }
            if (resultCode instanceof Number number) {
                return number.intValue();
            }
            String raw = String.valueOf(resultCode).trim();
            if (raw.isEmpty()) {
                return null;
            }
            try {
                return Integer.parseInt(raw);
            } catch (NumberFormatException ex) {
                return null;
            }
        }

        @JsonIgnore
        public boolean isSuccess() {
            Integer code = getResultCodeAsInt();
            return code != null && code == 0;
        }
    }

    @Data
    public static class CallbackMetadata {
        @JsonProperty("Item")
        private List<CallbackItem> item;
    }

    @Data
    public static class CallbackItem {
        @JsonProperty("Name")
        private String name;

        // Deliberately Object, not String — Amount/TransactionDate/PhoneNumber
        // arrive as numbers, MpesaReceiptNumber arrives as a string.
        @JsonProperty("Value")
        private Object value;
    }
}
