#!/usr/bin/env python3
"""
Run this script to generate the Berlin Fleet shortcut file.
Double-click the generated .shortcut file to install it on Mac/iPad.
"""

import plistlib, uuid, os

SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAqFMhAyssm9sZ1RrB_hFPmlV_hJlfao1LSKu1ghlYXRxI4Q0nVKoesV39bnmcDphv/exec"
SECRET     = "BoltFleet-Berlin-2026"
BOLT_API   = "https://admin-panel.bolt.eu/backend/rental-car-vehicle-fleet/adminPanel/vehicle/getList"
CITY       = 329

STATES = [
    ("hidden",            "Hidden"),
    ("in_service_shop",   "In Service Shop"),
    ("in_maintenance",    "In Maintenance"),
    ("lost",              "Lost"),
    ("deactivated",       "Deactivated"),
    ("waiting_for_order", "Waiting for Order"),
    ("reserved",          "Reserved"),
    ("on_trip",           "On Trip"),
]

JS_PHASE1 = """
localStorage.setItem('_bft','');
var of=window.fetch;
window.fetch=function(u,o){
  if(u&&u.indexOf('getList')!==-1&&o&&o.headers){
    var h=o.headers,a='';
    if(typeof h.get==='function')a=h.get('authorization')||h.get('Authorization')||'';
    else a=h['Authorization']||h['authorization']||'';
    if(a&&a.toLowerCase().indexOf('bearer ')===0)localStorage.setItem('_bft',a.replace(/^bearer /i,''));
  }
  return of.apply(this,arguments);
};
try{window.history.pushState({t:Date.now()},'',location.href);window.dispatchEvent(new PopStateEvent('popstate',{state:{}}));}catch(e){}
completion('ok');
""".strip()

JS_PHASE2 = """
var t=localStorage.getItem('_bft')||'';
localStorage.removeItem('_bft');
if(!t){
  for(var i=0;i<localStorage.length;i++){var v=localStorage.getItem(localStorage.key(i))||'';if(v.indexOf('eyJ')===0&&v.split('.').length===3&&v.length>50){t=v;break;}}
}
if(!t){
  for(var i=0;i<sessionStorage.length;i++){var v=sessionStorage.getItem(sessionStorage.key(i))||'';if(v.indexOf('eyJ')===0&&v.split('.').length===3&&v.length>50){t=v;break;}}
}
completion(t);
""".strip()

def uid():
    return str(uuid.uuid4()).upper()

def text_action(text):
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.gettext",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFTextActionText": text
        }
    }

def set_var(name):
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.setvariable",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFVariableName": name
        }
    }

def get_var(name):
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.getvariable",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFVariable": {
                "Value": {"VariableName": name, "Type": "Variable"},
                "WFSerializationType": "WFTextTokenAttachment"
            }
        }
    }

def run_js(js_code):
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.safari.runjavascript",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFJavaScript": js_code
        }
    }

def wait_action(seconds):
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.wait",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFDuration": {
                "Value": {
                    "Unit": "seconds",
                    "Magnitude": seconds
                },
                "WFSerializationType": "WFQuantityFieldValue"
            }
        }
    }

def http_post(url_text, body_text, token_var):
    token_attachment = {
        "Value": {"VariableName": token_var, "Type": "Variable"},
        "WFSerializationType": "WFTextTokenAttachment"
    }
    auth_header_value = {
        "WFSerializationType": "WFTextTokenString",
        "Value": {
            "string": "Bearer §",
            "attachmentsByRange": {
                "{7, 1}": {"VariableName": token_var, "Type": "Variable"}
            }
        }
    }
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFHTTPMethod": "POST",
            "WFURL": url_text,
            "WFHTTPHeaders": {
                "Value": {
                    "WFDictionaryFieldValueItems": [
                        {
                            "WFKey": {"Value": {"string": "Content-Type"}, "WFSerializationType": "WFTextTokenString"},
                            "WFValue": {"Value": {"string": "application/json"}, "WFSerializationType": "WFTextTokenString"}
                        },
                        {
                            "WFKey": {"Value": {"string": "Authorization"}, "WFSerializationType": "WFTextTokenString"},
                            "WFValue": auth_header_value
                        }
                    ]
                },
                "WFSerializationType": "WFDictionaryFieldValue"
            },
            "WFHTTPBodyType": "JSON",
            "WFRequestVariable": {
                "Value": {"string": body_text},
                "WFSerializationType": "WFTextTokenString"
            }
        }
    }

def get_dict_value(key):
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.getdictionaryvalue",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFDictionaryKey": key,
            "WFInput": {
                "Value": {"OutputUUID": "", "Type": "ActionOutput"},
                "WFSerializationType": "WFTextTokenAttachment"
            }
        }
    }

def notify(title, body_var):
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.notification",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFNotificationActionTitle": title,
            "WFNotificationActionBody": {
                "WFSerializationType": "WFTextTokenString",
                "Value": {
                    "string": "§",
                    "attachmentsByRange": {
                        "{0, 1}": {"VariableName": body_var, "Type": "Variable"}
                    }
                }
            }
        }
    }

def http_get(url_var):
    return {
        "WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFHTTPMethod": "GET",
            "WFURL": {
                "WFSerializationType": "WFTextTokenString",
                "Value": {
                    "string": "§",
                    "attachmentsByRange": {
                        "{0, 1}": {"VariableName": url_var, "Type": "Variable"}
                    }
                }
            }
        }
    }

# --- Build actions list ---
actions = []

# Step 1: Set up fetch interceptor
actions.append(run_js(JS_PHASE1))
actions.append(wait_action(4))

# Step 2: Read captured token
actions.append(run_js(JS_PHASE2))
actions.append(set_var("BearerToken"))

# Steps 3-10: Fetch each state count
count_vars = []
for state_key, state_label in STATES:
    body = '{{"filter":{{"vehicle_states":["{key}"],"city_ids":[{city}]}},"items_per_page":1,"page_number":0}}'.format(
        key=state_key, city=CITY
    )
    actions.append(http_post(BOLT_API, body, "BearerToken"))
    # Get total_rows from response
    actions.append({
        "WFWorkflowActionIdentifier": "is.workflow.actions.getvalueforkey",
        "WFWorkflowActionParameters": {
            "UUID": uid(),
            "WFGetDictionaryValueType": "Value",
            "WFKey": {"Value": {"string": "data.pages.total_rows"}, "WFSerializationType": "WFTextTokenString"},
        }
    })
    var_name = "Count_" + state_key
    actions.append(set_var(var_name))
    count_vars.append((state_key, state_label, var_name))

# Step 11: Build save URL and save via GET to Apps Script
# Build a text action that constructs the URL
# This is the simplest approach - build the URL as text

shortcut = {
    "WFWorkflowClientVersion": "1140.10",
    "WFWorkflowMinimumClientVersion": 900,
    "WFWorkflowMinimumClientVersionString": "900",
    "WFWorkflowName": "Berlin Fleet",
    "WFWorkflowIcon": {
        "WFWorkflowIconStartColor": 431817727,
        "WFWorkflowIconGlyphNumber": 59511
    },
    "WFWorkflowActions": actions,
    "WFWorkflowImportQuestions": [],
    "WFWorkflowTypes": [],
    "WFWorkflowInputContentItemClasses": []
}

output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "BerlinFleet.shortcut")
with open(output_path, "wb") as f:
    plistlib.dump(shortcut, f, fmt=plistlib.FMT_BINARY)

print("Created: " + output_path)
print("Double-click BerlinFleet.shortcut to install on your Mac.")
print("It will also sync to your iPad via iCloud automatically.")
