import React, { useState } from "react";
import { DropdownToggle, DropdownMenu, Dropdown } from "reactstrap";
import { Icon } from "@/components/Component";
import { LinkList, LinkItem } from "@/components/links/Links";
import UserAvatar from "@/components/user/UserAvatar";
import { useTheme, useThemeUpdate } from "@/layout/provider/Theme";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const User = () => {
  const theme = useTheme();
  const themeUpdate = useThemeUpdate();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((prevState) => !prevState);

  return (
    <Dropdown isOpen={open} className="user-dropdown" toggle={toggle}>
      <DropdownToggle
        tag="a"
        href="#toggle"
        className="dropdown-toggle"
        onClick={(ev) => {
          ev.preventDefault();
        }}
      >
        <div className="user-toggle">
          <UserAvatar icon="user-alt" className="sm" />
          <div className="user-info d-none d-md-block">
            <div className="user-status">Administrator</div>
            <div className="user-name dropdown-indicator">{user?.email || "User"}</div>
          </div>
        </div>
      </DropdownToggle>
      <DropdownMenu end className="dropdown-menu-md dropdown-menu-s1">
        <div className="dropdown-inner user-card-wrap bg-lighter d-none d-md-block">
          <div className="user-card sm">
            <div className="user-avatar">
              <span>AB</span>
            </div>
            <div className="user-info">
              <span className="lead-text">{user?.email || "User"}</span>
              <span className="sub-text">Signed in</span>
            </div>
          </div>
        </div>
          <div className="dropdown-inner">
            <LinkList>
              <LinkItem link="/user-profile-regular" icon="user-alt" onClick={toggle}>
                View Profile
              </LinkItem>
              <li>
                <a
                  className={`dark-switch ${theme.skin === "dark" ? "active" : ""}`}
                  href="#"
                  onClick={(ev) => {
                    ev.preventDefault();
                    themeUpdate.skin(theme.skin === "dark" ? "light" : "dark");
                  }}
                >
                  {theme.skin === "dark" ? (
                    <>
                      <em className="icon ni ni-sun"></em>
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <em className="icon ni ni-moon"></em>
                      <span>Dark Mode</span>
                    </>
                  )}
                </a>
              </li>
            </LinkList>
          </div>
        <div className="dropdown-inner">
          <LinkList>
            <li>
              <a
                className="link"
                href="#logout"
                onClick={(e) => {
                  e.preventDefault();
                  toggle();
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <Icon name="signout" />
                <span>Sign Out</span>
              </a>
            </li>
          </LinkList>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default User;
